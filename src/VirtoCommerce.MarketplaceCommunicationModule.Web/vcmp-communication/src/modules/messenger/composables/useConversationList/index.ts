import { computed, ComputedRef, Ref, ref } from "vue";
import {
  VcmpConversationClient,
  SearchConversationsQuery,
  ISearchConversationsQuery,
  SearchConversationResult,
  Conversation,
} from "../../../../api_client/virtocommerce.marketplacecommunication";
import { useApiClient, useAsync } from "@vc-shell/framework";

export interface IUseConversationList {
  conversations: ComputedRef<Conversation[]>;
  totalCount: ComputedRef<number>;
  pages: ComputedRef<number>;
  currentPage: ComputedRef<number>;
  loading: ComputedRef<boolean>;
  searchQuery: Ref<ISearchConversationsQuery>;
  getConversations: (args: ISearchConversationsQuery) => Promise<void>;
}

const { getApiClient: conversationClient } = useApiClient(VcmpConversationClient);

export function useConversationList(): IUseConversationList {
  const searchQuery = ref<ISearchConversationsQuery>({
    skip: 0,
    take: 20,
  });
  const pageSize = 20;
  const searchResult = ref<SearchConversationResult>();

  const { action: getConversations, loading } = useAsync<ISearchConversationsQuery>(async (args) => {
    searchQuery.value = {
      ...searchQuery.value,
      ...args,
    };

    const command = new SearchConversationsQuery({
      ...searchQuery.value,
      responseGroup: "Full",
    });

    searchResult.value = await (await conversationClient()).search(command);
  });

  return {
    conversations: computed(() => searchResult.value?.results ?? []),
    totalCount: computed(() => searchResult.value?.totalCount ?? 0),
    pages: computed(() => Math.ceil((searchResult.value?.totalCount ?? 1) / pageSize)),
    currentPage: computed(() => (searchQuery.value?.skip || 0) / Math.max(1, pageSize) + 1),
    loading: computed(() => loading.value),
    searchQuery,
    getConversations,
  };
}
