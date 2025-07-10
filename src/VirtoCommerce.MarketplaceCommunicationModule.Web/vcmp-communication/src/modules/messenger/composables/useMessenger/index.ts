import { Ref, computed, ref, ComputedRef, shallowRef, inject } from "vue";
import { useAsync } from "@vc-shell/framework";
import {
  SearchMessagesQuery,
  Message,
  CommunicationUser,
  IUpdateMessageCommand,
  IDeleteMessageCommand,
  ISearchMessagesQuery,
  IMarkMessageAsReadCommand,
  IGetSellerCommunicationUserQuery,
  ISearchMessageResult,
  IGetUnreadCountQuery,
  IMessage,
  Conversation,
  MessageAttachment,
  MarketplaceCommunicationSettings,
  GetSellerCommunicationUserQuery,
} from "@vcmp-communication/api/marketplacecommunication";
import { useMessageApi } from "../useMessageApi";
import { useConversationApi } from "../useConversationApi";
import { useUserApi } from "../useUserApi";
import { useSettingsApi } from "../useSettingsApi";

export interface IUseMessenger {
  messages: Ref<Message[] | undefined>;
  sendMessage: (message: {
    content: string;
    replyTo: string | undefined;
    sellerId: string;
    sellerName: string;
    entityId: string;
    entityType: string;
    rootsOnly?: boolean;
    threadId?: string;
    conversationId?: string;
    attachments?: MessageAttachment[];
  }) => Promise<Message | undefined>;
  unreadCount: ComputedRef<number>;
  searchMessages: (query: ISearchMessagesQuery) => Promise<void>;
  searchMessagesLoading: Ref<boolean>;
  searchQuery: Ref<SearchMessagesQuery>;
  operator: Ref<CommunicationUser | undefined>;
  getOperator: () => Promise<void>;
  getRootMessages: () => Message[];
  updateMessage: (message: IUpdateMessageCommand) => Promise<void>;
  removeMessage: (message: IDeleteMessageCommand) => Promise<void>;
  loadMoreMessages: (query: ISearchMessagesQuery) => Promise<boolean>;
  totalItems: ComputedRef<number>;
  sendMessageLoading: Ref<boolean>;
  loadPreviousMessages: (query?: ISearchMessagesQuery) => Promise<boolean>;
  hasOlderMessages: Ref<boolean>;
  hasNewerMessages: ComputedRef<boolean>;
  updateMessageLoading: Ref<boolean>;
  markMessageAsRead: (args: IMarkMessageAsReadCommand) => Promise<void>;
  getSeller: (query: IGetSellerCommunicationUserQuery) => Promise<void>;
  getUnreadCount: (query: IGetUnreadCountQuery) => Promise<number>;
  getThread: (id: string | undefined) => Promise<void>;
  seller: Ref<CommunicationUser | undefined>;
  loadedThread: Ref<Message[] | undefined>;
  createConversation: (args: {
    sellerId: string;
    sellerName: string;
    userIds: string[];
    iconUrl?: string;
    entityId?: string;
    entityType?: string;
  }) => Promise<Conversation>;
  getConversation: (entityId: string, entityType: string) => Promise<Conversation>;
  settings: ComputedRef<MarketplaceCommunicationSettings | undefined>;
  getSettings: () => Promise<void>;
  getSettingsLoading: Ref<boolean>;
  getOperatorLoading: Ref<boolean>;
}

const operator = ref<CommunicationUser>();

export const useMessenger = (): IUseMessenger => {
  const currentSeller = inject("currentSeller") as Ref<{ id: string; name: string }>;

  // API composables
  const {
    searchMessages: searchMessagesApi,
    sendMessage: sendMessageApi,
    updateMessage: updateMessageApi,
    removeMessage: removeMessageApi,
    markMessageAsRead: markMessageAsReadApi,
    getUnreadCount: getUnreadCountApi,
    getThread: getThreadApi,
  } = useMessageApi();

  const { createConversation: createConversationApi, getConversation: getConversationApi } = useConversationApi();
  const {
    getOperator: getOperatorApi,
    getSeller: getSellerApi,
    getUsers: getUsersApi,
    getUser: getUserApi,
  } = useUserApi();
  const { getSettings: getSettingsApi } = useSettingsApi();

  // State
  const messages = shallowRef<Message[] | undefined>([]);
  const searchResult = shallowRef<ISearchMessageResult | null>(null);
  const searchQuery = ref<SearchMessagesQuery>(
    new SearchMessagesQuery({
      take: 10,
    }),
  );
  const loadedThread = ref<Message[] | undefined>([]);
  const settings = ref<MarketplaceCommunicationSettings>();
  const seller = ref<CommunicationUser>();

  const hasOlderMessages = ref(false);
  const hasNewerMessages = ref(false);

  // Private helpers
  async function loadUserInfoForMessages(messagesToUpdate: Message[] | undefined) {
    if (!messagesToUpdate) return;
    const userIds = Array.from(new Set(messagesToUpdate.map((m) => m.senderId))).filter((id) => id) as string[];
    if (userIds?.length) {
      const { action: getUsers } = useAsync(() => getUsersApi(userIds));
      const users = await getUsers();
      messagesToUpdate.forEach((message) => {
        const user = users.find((u) => u.id === message.senderId);
        if (user) {
          message.sender = user;
        }
      });
    }
  }

  // Actions
  const { action: searchMessages, loading: searchMessagesLoading } = useAsync<ISearchMessagesQuery>(async (query) => {
    if (!query) return;
    searchQuery.value = { ...searchQuery.value, ...query };
    const result = await searchMessagesApi(searchQuery.value);
    searchResult.value = result;
    await loadUserInfoForMessages(result.results);
    messages.value = result.results;
    hasNewerMessages.value = (result?.totalCount || 0) > (messages.value?.length || 0);
  });

  const { action: sendMessage, loading: sendMessageLoading } = useAsync<
    {
      content: string;
      replyTo: string | undefined;
      sellerId: string;
      sellerName: string;
      entityId: string;
      entityType: string;
      rootsOnly?: boolean;
      threadId?: string;
      conversationId?: string;
      attachments?: MessageAttachment[];
    },
    Message | undefined
  >(async (message) => {
    if (!message) return;

    const sentTime = new Date();

    await sendMessageApi({ ...message, recipientId: operator.value?.id });

    // Re-fetch messages to get the new one
    const latestMessagesQuery = new SearchMessagesQuery({
      ...searchQuery.value,
      take: 10,
      sort: "createdDate:desc",
      conversationId: message.conversationId,
      responseGroup: "Full",
      entityId: message.entityId,
      entityType: message.entityType,
      rootsOnly: message.rootsOnly,
      threadId: message.threadId,
    });

    const result = await searchMessagesApi(latestMessagesQuery);
    await loadUserInfoForMessages(result.results);

    searchResult.value = result;
    messages.value = result.results?.reverse() || [];
    hasOlderMessages.value = (result.totalCount || 0) > (messages.value?.length || 0);
    hasNewerMessages.value = false;

    // Find the new message to return it
    return messages.value.find((msg) => {
      const timeDiff = msg.createdDate ? Math.abs(new Date(msg.createdDate).getTime() - sentTime.getTime()) : 0;
      return msg.content === message.content && timeDiff <= 10000;
    });
  });

  const { action: updateMessage, loading: updateMessageLoading } = useAsync<IUpdateMessageCommand>(async (message) => {
    if (!message || !message.messageId) return;
    await updateMessageApi({
      ...message,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
    });
  });

  const { action: removeMessage } = useAsync<IDeleteMessageCommand>(async (args) => {
    if (!args || !args.messageIds) return;
    await removeMessageApi({
      ...args,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
    });
  });

  const { action: getOperator, loading: getOperatorLoading } = useAsync(async () => {
    if (!operator.value) {
      operator.value = await getOperatorApi();
      console.log("operator", operator.value);
    }
  });

  const { action: markMessageAsRead } = useAsync<IMarkMessageAsReadCommand>(async (args) => {
    if (!args) return;
    await markMessageAsReadApi(args);
  });

  const { action: getSeller } = useAsync<IGetSellerCommunicationUserQuery>(async (query) => {
    if (!query) return;
    seller.value = await getSellerApi(new GetSellerCommunicationUserQuery(query));
  });

  const { action: getSettings, loading: getSettingsLoading } = useAsync(async () => {
    settings.value = await getSettingsApi();
  });

  const { action: getUnreadCount } = useAsync<IGetUnreadCountQuery, number>(async (query) => {
    if (!query) return 0;
    return getUnreadCountApi({
      ...query,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
    });
  });

  const { action: getThread } = useAsync<string | undefined>(async (id) => {
    const result = await getThreadApi(id);
    await loadUserInfoForMessages(result);

    const buildMessageTree = (treeMessages: Message[]): Message[] => {
      const messageMap = new Map<string, IMessage>();
      const rootMessages: Message[] = [];
      treeMessages.forEach((msg) => messageMap.set(msg.id!, { ...msg, answers: [] }));
      treeMessages.forEach((msg) => {
        const message = messageMap.get(msg.id!);
        if (message) {
          if (msg.threadId) {
            const parentMessage = messageMap.get(msg.threadId);
            if (parentMessage) {
              if (!parentMessage.answers) parentMessage.answers = [];
              parentMessage.answers.push(new Message(message));
              parentMessage.answersCount = parentMessage.answers.length;
            }
          } else {
            rootMessages.push(new Message(message));
          }
        }
      });
      return rootMessages;
    };

    loadedThread.value = buildMessageTree(result);
    messages.value = result;
  });

  // Public functions that use state and actions
  const getRootMessages = () => messages.value?.filter((msg) => !msg.threadId) || [];

  const loadMoreMessages = async (query: ISearchMessagesQuery): Promise<boolean> => {
    if (!searchResult.value || (messages.value?.length || 0) >= (searchResult.value?.totalCount || 0)) {
      return false;
    }
    const newQuery = { ...searchQuery.value, ...query, skip: messages.value?.length || 0 };
    const result = await searchMessagesApi(newQuery);
    await loadUserInfoForMessages(result.results);

    if (messages.value?.length) {
      hasNewerMessages.value = (result.totalCount || 0) > (messages.value.length || 0) + (newQuery.take || 0);
    }
    if (result.results?.length) {
      const allMessages = [...(messages.value || []), ...result.results];
      const uniqueMessages = Array.from(new Map(allMessages.map((msg) => [msg.id, msg])).values());
      searchResult.value.results = uniqueMessages;
      messages.value = uniqueMessages;
    }
    return (result.results?.length || 0) > 0;
  };

  const loadPreviousMessages = async (query?: ISearchMessagesQuery): Promise<boolean> => {
    const previousQuery = new SearchMessagesQuery({
      ...searchQuery.value,
      ...(query || {}),
      skip: messages.value?.length || 0,
      sort: "createdDate:desc",
    });

    const result = await searchMessagesApi(previousQuery);
    await loadUserInfoForMessages(result.results);

    if (messages.value?.length) {
      hasOlderMessages.value = (result.totalCount || 0) > (messages.value.length || 0) + (previousQuery.take || 0);
    }
    if (result.results?.length) {
      const allMessages = [...(result.results?.reverse() || []), ...(messages.value || [])];
      const uniqueMessages = Array.from(new Map(allMessages.map((msg) => [msg.id, msg])).values());
      searchResult.value = { results: uniqueMessages, totalCount: result.totalCount };
      messages.value = uniqueMessages;
    }
    return (result.results?.length || 0) > 0;
  };

  return {
    messages,
    sendMessage,
    unreadCount: computed(
      () => messages.value?.filter((msg) => msg.recipients?.some((r) => r.readStatus === "New"))?.length || 0,
    ),
    searchMessages,
    searchMessagesLoading,
    searchQuery,
    operator,
    getOperator,
    getRootMessages,
    updateMessage,
    removeMessage,
    loadMoreMessages,
    totalItems: computed(() => searchResult.value?.totalCount || 0),
    sendMessageLoading,
    loadPreviousMessages,
    hasOlderMessages,
    hasNewerMessages: computed(() => {
      if (!messages.value || !searchResult.value) return false;
      if (hasNewerMessages.value) return true;
      const currentPosition = (searchQuery.value.skip || 0) + (messages.value?.length || 0);
      return currentPosition < (searchResult.value?.totalCount || 0);
    }),
    updateMessageLoading,
    markMessageAsRead,
    getSeller,
    getThread,
    getUnreadCount,
    seller,
    loadedThread,
    createConversation: createConversationApi,
    getConversation: getConversationApi,
    settings: computed(() => settings.value),
    getSettings,
    getOperatorLoading,
    getSettingsLoading,
  };
};
