import { ref, computed, shallowRef, inject } from "vue";
import { useAsync } from "@vc-shell/framework";
import {
  SearchMessagesQuery,
  Message,
  CommunicationUser,
  Conversation,
  MarketplaceCommunicationSettings,
  GetSellerCommunicationUserQuery,
  SearchMessageResult,
} from "@vcmp-communication/api/marketplacecommunication";
import { useMessageApi } from "./useMessageApi";
import { useConversationApi } from "./useConversationApi";
import { useUserApi } from "./useUserApi";
import { useSettingsApi } from "./useSettingsApi";
import { type MessengerStore, messengerStoreKey } from "../injection-keys";

export function createMessengerStore(): MessengerStore {
  // API composables
  const { searchMessages: searchMessagesApi, getThread: getThreadApi } = useMessageApi();
  const { getConversation: getConversationApi } = useConversationApi();
  const { getOperator: getOperatorApi, getSeller: getSellerApi, getUsers: getUsersApi } = useUserApi();
  const { getSettings: getSettingsApi } = useSettingsApi();

  // --- Local state (scoped to this factory instance) ---
  const messages = shallowRef<Message[]>([]);
  const searchResult = shallowRef<SearchMessageResult | null>(null);
  const searchQuery = ref<SearchMessagesQuery>({
    take: 10,
  } as SearchMessagesQuery);
  const operator = ref<CommunicationUser>();
  const seller = ref<CommunicationUser>();
  const settings = ref<MarketplaceCommunicationSettings>();
  const conversation = ref<Conversation>();
  const hasOlderMessages = ref(false);

  const quotesCache = new Map<string, Message>();

  async function getQuotedMessage(messageId: string): Promise<Message | null> {
    // 1. Check loaded messages
    const inMessages = messages.value.find((m) => m.id === messageId);
    if (inMessages) return inMessages;

    // 2. Check cache
    const cached = quotesCache.get(messageId);
    if (cached) return cached;

    // 3. Lazy fetch via getThread (returns ancestor chain)
    try {
      const chain = await getThreadApi(messageId);
      if (chain?.length) {
        await loadUserInfoForMessages(chain);
        for (const msg of chain) {
          if (msg.id) quotesCache.set(msg.id, msg);
        }
        return chain.find((m) => m.id === messageId) ?? null;
      }
    } catch {
      // API error — return null, UI shows "Message unavailable"
    }
    return null;
  }

  // --- Computed ---
  const hasNewerMessages = computed(() => {
    if (!messages.value.length || !searchResult.value) return false;
    const currentPosition = (searchQuery.value.skip || 0) + messages.value.length;
    return currentPosition < (searchResult.value.totalCount || 0);
  });

  // --- Private helpers ---
  async function loadUserInfoForMessages(messagesToUpdate: Message[] | undefined) {
    if (!messagesToUpdate || !messagesToUpdate.length) return;
    const userIds = Array.from(new Set(messagesToUpdate.map((m) => m.senderId))).filter(Boolean) as string[];
    if (userIds.length) {
      const users = await getUsersApi(userIds);
      messagesToUpdate.forEach((message) => {
        const user = users.find((u) => u.id === message.senderId);
        if (user) {
          message.sender = user;
        }
      });
    }
  }

  // --- Actions ---
  const { action: loadMessagesAction, loading: searchMessagesLoading } = useAsync<SearchMessagesQuery>(
    async (query) => {
      if (!query) return;
      // Load newest messages first (desc), then reverse for chronological display
      searchQuery.value = {
        ...searchQuery.value,
        ...query,
        sort: "createdDate:desc",
      } as SearchMessagesQuery;
      const result = await searchMessagesApi(searchQuery.value);
      searchResult.value = result;
      await loadUserInfoForMessages(result.results);
      // Reverse: API returns newest-first, but UI needs oldest-first (chronological)
      messages.value = (result.results || []).reverse();
      hasOlderMessages.value = (result.totalCount || 0) > (messages.value.length || 0);
    },
  );

  const sendMessageLoading = ref(false);

  // --- Mutations ---
  function setMessages(msgs: Message[]) {
    messages.value = msgs;
  }

  function updateMessageInList(message: Message) {
    const idx = messages.value.findIndex((m) => m.id === message.id);
    if (idx !== -1) {
      const updated = [...messages.value];
      updated[idx] = message;
      messages.value = updated;
    }
  }

  function removeMessageFromList(ids: string[]) {
    messages.value = messages.value.filter((m) => !ids.includes(m.id!));
  }

  // --- Actions ---
  async function loadMessages(query: SearchMessagesQuery): Promise<void> {
    await loadMessagesAction(query);
  }

  async function loadMoreMessages(query: SearchMessagesQuery): Promise<boolean> {
    if (!searchResult.value || messages.value.length >= (searchResult.value.totalCount || 0)) {
      return false;
    }
    const newQuery = {
      ...searchQuery.value,
      ...query,
      skip: messages.value.length,
    } as SearchMessagesQuery;
    const result = await searchMessagesApi(newQuery);
    await loadUserInfoForMessages(result.results);

    if (result.results?.length) {
      const allMessages = [...messages.value, ...result.results];
      const uniqueMessages = Array.from(new Map(allMessages.map((msg) => [msg.id, msg])).values());
      searchResult.value = { ...searchResult.value, results: uniqueMessages, totalCount: result.totalCount };
      messages.value = uniqueMessages;
    }
    return (result.results?.length || 0) > 0;
  }

  async function loadPreviousMessages(query?: SearchMessagesQuery): Promise<boolean> {
    const previousQuery = {
      ...searchQuery.value,
      ...(query || {}),
      skip: messages.value.length,
      sort: "createdDate:desc",
    } as SearchMessagesQuery;

    const result = await searchMessagesApi(previousQuery);
    await loadUserInfoForMessages(result.results);

    if (messages.value.length) {
      hasOlderMessages.value = (result.totalCount || 0) > messages.value.length + (previousQuery.take || 0);
    }
    if (result.results?.length) {
      const allMessages = [...(result.results.reverse() || []), ...messages.value];
      const uniqueMessages = Array.from(new Map(allMessages.map((msg) => [msg.id, msg])).values());
      searchResult.value = { results: uniqueMessages, totalCount: result.totalCount };
      messages.value = uniqueMessages;
    }
    return (result.results?.length || 0) > 0;
  }

  async function initializeConversation(options: {
    entityId?: string;
    entityType?: string;
    conversation?: Conversation;
  }): Promise<void> {
    // 1. Set conversation
    if (options.conversation) {
      conversation.value = options.conversation;
    } else if (options.entityId && options.entityType) {
      conversation.value = await getConversationApi(options.entityId, options.entityType);
    }

    // 2. Load operator
    if (!operator.value) {
      operator.value = await getOperatorApi();
    }

    // 3. Load seller if entityId+entityType provided
    if (options.entityId && options.entityType) {
      seller.value = await getSellerApi({
        entityId: options.entityId,
        entityType: options.entityType,
      } as GetSellerCommunicationUserQuery);
    }

    // 4. Load settings
    settings.value = await getSettingsApi();
  }

  function reset() {
    messages.value = [];
    searchResult.value = null;
    searchQuery.value = { take: 10 } as SearchMessagesQuery;
    conversation.value = undefined;
    seller.value = undefined;
    settings.value = undefined;
    hasOlderMessages.value = false;
    quotesCache.clear();
  }

  return {
    // State
    messages,
    operator,
    seller,
    settings,
    conversation,

    // Pagination
    hasOlderMessages,
    hasNewerMessages,
    searchQuery,
    searchMessagesLoading,
    sendMessageLoading,

    // Mutations
    setMessages,
    updateMessageInList,
    removeMessageFromList,

    // Quotes
    quotesCache,
    getQuotedMessage,

    // Actions
    loadMessages,
    loadMoreMessages,
    loadPreviousMessages,
    initializeConversation,

    // Cleanup
    reset,
  };
}

export function useMessengerStore(): MessengerStore {
  const store = inject(messengerStoreKey);
  if (!store) throw new Error("useMessengerStore() called outside of Messenger blade");
  return store;
}
