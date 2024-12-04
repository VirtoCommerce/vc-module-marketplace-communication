import { Ref, ref } from "vue";
import {
  VcmpConversationClient,
  Conversation,
  SearchConversationsQuery,
  ISearchConversationsQuery,
} from "../../../../api_client/virtocommerce.marketplacecommunication";
import { useApiClient, useAsync } from "@vc-shell/framework";

const { getApiClient: conversationClient } = useApiClient(VcmpConversationClient);

export function useConversationList() {
  const conversations = ref<Conversation[]>([]) as Ref<Conversation[]>;
  const searchQuery = ref<ISearchConversationsQuery>({
    skip: 0,
    take: 20,
  });
  const hasMore = ref(true);

  const { action: getConversations, loading } = useAsync<{ sellerId: string | undefined }>(async (args) => {
    const command = new SearchConversationsQuery({
      sellerId: args?.sellerId,
      responseGroup: "Full",
      skip: searchQuery.value.skip,
      take: searchQuery.value.take,
    });

    const searchResult = await (await conversationClient()).search(command);

    if (searchQuery.value.skip === 0) {
      conversations.value = searchResult.results || [];
    } else {
      conversations.value = [...conversations.value, ...(searchResult.results || [])];
    }

    hasMore.value = (searchResult.results?.length || 0) === searchQuery.value.take;
  });

  const loadMore = async () => {
    if (!loading.value && hasMore.value) {
      searchQuery.value.skip! += searchQuery.value.take!;
      await getConversations();
    }
  };

  return {
    conversations,
    loading,
    getConversations,
    loadMore,
    hasMore,
  };
}
