import { Ref, computed, ref, ComputedRef, shallowRef, inject } from "vue";
import { useApiClient, useAsync } from "@vc-shell/framework";
import {
  SearchMessageResult,
  SearchMessagesQuery,
  VcmpCommunicationUserClient,
  VcmpMessageClient,
  Message,
  CommunicationUser,
  SendMessageCommand,
  MessageShort,
  UpdateMessageCommand,
  IUpdateMessageCommand,
  DeleteMessageCommand,
  IDeleteMessageCommand,
  ISearchMessagesQuery,
  MarkMessageAsReadCommand,
  IMarkMessageAsReadCommand,
  GetSellerCommunicationUserQuery,
  ISearchMessageResult,
  GetUnreadCountQuery,
  IGetUnreadCountQuery,
  IGetSellerCommunicationUserQuery,
} from "@vcmp-communication/api/marketplacecommunication";

export interface IUseMessages {
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
}

const { getApiClient: getCommunicationUserClient } = useApiClient(VcmpCommunicationUserClient);
const { getApiClient: getMessagingClient } = useApiClient(VcmpMessageClient);
const operator = ref<CommunicationUser>();

export const useMessages = (): IUseMessages => {
  const currentSeller = inject("currentSeller") as Ref<{ id: string; name: string }>;
  const messages = shallowRef<Message[] | undefined>([]);
  const searchResult = shallowRef<ISearchMessageResult | null>(null);
  const searchQuery = ref<SearchMessagesQuery>(
    new SearchMessagesQuery({
      take: 10,
      // skip: 0,
    }),
  );
  const loadedThread = ref<Message[] | undefined>([]);

  const seller = ref<CommunicationUser>();

  const { action: getUsersInfo } = useAsync<string[] | undefined, CommunicationUser[]>(async (ids) => {
    const client = await getCommunicationUserClient();
    return await client.getCommunicationUsers(ids);
  });

  const hasOlderMessages = ref(false);
  const hasNewerMessages = ref(false);

  const { action: searchMessages, loading: searchMessagesLoading } = useAsync<ISearchMessagesQuery>(async (query) => {
    const client = await getMessagingClient();
    searchQuery.value = {
      ...searchQuery.value,
      ...query,
    };

    searchResult.value = await client.search(new SearchMessagesQuery(searchQuery.value));
    messages.value = searchResult.value.results;

    hasNewerMessages.value = (searchResult.value?.totalCount || 0) > (messages.value?.length || 0);

    if (searchResult.value.results && searchResult.value.results.length > 0) {
      await loadUserInfoForMessages(searchResult.value.results);
    }
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
    },
    Message | undefined
  >(async (message) => {
    const client = await getMessagingClient();
    const sentTime = new Date();

    const command = new SendMessageCommand({
      sellerId: message?.sellerId,
      sellerName: message?.sellerName,
      message: new MessageShort({
        content: message?.content,
        replyTo: message?.replyTo,
        entityId: message?.entityId,
        entityType: message?.entityType,
        senderId: undefined,
        recipientId: operator.value?.id,
      }),
    });
    await client.sendMessage(command);

    // Load last 5 messages after sending
    const latestMessagesQuery = new SearchMessagesQuery({
      ...searchQuery.value,
      take: 10,
      sort: "createdDate:desc",
      responseGroup: "Full",
      entityId: message?.entityId,
      entityType: message?.entityType,
      rootsOnly: message?.rootsOnly,
      threadId: message?.threadId,
    });

    const result = await client.search(latestMessagesQuery);
    searchResult.value = result;

    await loadUserInfoForMessages(result.results);

    messages.value = result.results?.reverse() || [];



    hasOlderMessages.value = (result.totalCount || 0) > (messages.value?.length || 0);
    hasNewerMessages.value = false;

    const newMessage = messages.value.find((msg) => {
      const timeDiff = msg.createdDate ? Math.abs(new Date(msg.createdDate).getTime() - sentTime.getTime()) : 0;
      return msg.content === message?.content && timeDiff <= 10000; // 10 seconds
    });

    return newMessage;
  });

  const { action: updateMessage, loading: updateMessageLoading } = useAsync<IUpdateMessageCommand>(async (message) => {
    const command = new UpdateMessageCommand({
      ...message,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
    } as IUpdateMessageCommand);
    const client = await getMessagingClient();
    await client.updateMessage(command);
  });

  const { action: removeMessage } = useAsync<IDeleteMessageCommand>(async (args) => {
    const command = new DeleteMessageCommand({
      ...args,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
    } as IDeleteMessageCommand);
    const client = await getMessagingClient();
    await client.deleteMessage(command);
  });

  const { action: getOperator } = useAsync(async () => {
    const client = await getCommunicationUserClient();
    operator.value = await client.getOperator();
  });

  const { action: markAsRead } = useAsync<IMarkMessageAsReadCommand>(async (args) => {
    const client = await getMessagingClient();
    await client.markMessageAsRead(new MarkMessageAsReadCommand(args));
  });

  const { action: getSeller } = useAsync<IGetSellerCommunicationUserQuery>(async (query) => {
    const client = await getCommunicationUserClient();
    seller.value = await client.getSeller(new GetSellerCommunicationUserQuery(query));
  });

  const unreadCount = computed(
    () => messages.value?.filter((msg) => msg.recipients?.some((r) => r.readStatus === "New"))?.length || 0,
  );

  const getRootMessages = () => {
    return messages.value?.filter((msg) => !msg.threadId) || [];
  };

  const loadMoreMessages = async (query: ISearchMessagesQuery) => {
    if (!searchResult.value || (messages.value?.length || 0) >= (searchResult.value?.totalCount || 0)) {
      return false;
    }

    try {
      const client = await getMessagingClient();
      const newQuery = {
        ...searchQuery.value,
        ...query,
        skip: messages.value?.length || 0,
      };

      const result = await client.search(new SearchMessagesQuery(newQuery));

      await loadUserInfoForMessages(result.results);

      if (messages.value?.length) {
        hasNewerMessages.value = (result.totalCount || 0) > (messages.value?.length || 0) + (newQuery.take || 0);
      }

      if (result.results?.length) {
        searchResult.value = {
          ...result,
          results: [...(messages.value || []), ...result.results],
        };

        const uniqueMessages = new Map();
        (searchResult.value?.results || []).forEach((msg) => uniqueMessages.set(msg.id, msg));
        messages.value = Array.from(uniqueMessages.values());
      }

      return (result.results?.length || 0) > 0;
    } catch (error) {
      console.error("Error loading more messages:", error);
      return false;
    }
  };

  const loadPreviousMessages = async (query?: ISearchMessagesQuery) => {
    try {
      const client = await getMessagingClient();
      const previousQuery = new SearchMessagesQuery({
        ...searchQuery.value,
        ...(query || {}),
        skip: messages.value?.length || 0,
        sort: "createdDate:desc",
      });

      const result = await client.search(previousQuery);

      await loadUserInfoForMessages(result.results);

      if (messages.value?.length) {
        hasOlderMessages.value = (result.totalCount || 0) > (messages.value?.length || 0) + (previousQuery.take || 0);
      }

      if (result.results?.length) {
        searchResult.value = {
          results: [...(result.results?.reverse() || []), ...(messages.value || [])],
          totalCount: result.totalCount,
        };

        const uniqueMessages = new Map();
        (searchResult.value?.results || []).forEach((msg) => uniqueMessages.set(msg.id, msg));
        messages.value = Array.from(uniqueMessages.values());
      }

      return (result.results?.length || 0) > 0;
    } catch (error) {
      console.error("Error loading previous messages:", error);
      return false;
    }
  };

  const { action: getUnreadCount } = useAsync<IGetUnreadCountQuery, number>(async (query) => {
    const client = await getMessagingClient();
    const result = await client.getUnreadMessageCount(
      new GetUnreadCountQuery({
        ...query,
        sellerId: currentSeller.value?.id,
        sellerName: currentSeller.value?.name,
      } as IGetUnreadCountQuery),
    );
    return result || 0;
  });

  const { action: getThread } = useAsync<string | undefined>(async (id) => {
    const client = await getMessagingClient();
    const result = await client.getThread(id);
    loadedThread.value = result;
  });

  async function loadUserInfoForMessages(messages: Message[] | undefined) {
    const userIds = Array.from(new Set(messages?.map((m) => m.senderId))).filter((id) => id) as string[];
    if (userIds?.length) {
      const users = await getUsersInfo(userIds);
      messages?.forEach((message) => {
        const user = users.find((u) => u.id === message.senderId);
        if (user) {
          message.senderInfo = user;
        }
      });
    }
  }

  return {
    messages,
    sendMessage,
    unreadCount,
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
      if (!messages.value || !searchResult.value || !hasNewerMessages.value) return false;
      if (hasNewerMessages.value) return true;

      const currentPosition = (searchQuery.value.skip || 0) + (messages.value?.length || 0);
      return currentPosition < (searchResult.value?.totalCount || 0);
    }),
    updateMessageLoading,
    markMessageAsRead: markAsRead,
    getSeller,
    getThread,
    getUnreadCount,
    seller,
    loadedThread,
  };
};
