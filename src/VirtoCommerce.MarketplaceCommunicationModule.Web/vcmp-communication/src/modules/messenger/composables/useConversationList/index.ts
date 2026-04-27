import { computed, ComputedRef, Ref, ref } from "vue";
import {
  VcmpConversationClient,
  SearchConversationsQuery,
  SearchConversationResult,
  Conversation,
} from "../../../../api_client/virtocommerce.marketplacecommunication";
import {
  useApiClient,
  useAsync,
  useDataTablePagination,
  type UseDataTablePaginationReturn,
} from "@vc-shell/framework";

export interface IUseConversationList {
  conversations: ComputedRef<Conversation[]>;
  pagination: UseDataTablePaginationReturn;
  loading: ComputedRef<boolean>;
  searchQuery: Ref<SearchConversationsQuery>;
  getConversations: (args: SearchConversationsQuery) => Promise<void>;
}

const { getApiClient: conversationClient } = useApiClient(VcmpConversationClient);

export function useConversationList(): IUseConversationList {
  const searchQuery = ref<SearchConversationsQuery>({
    skip: 0,
    take: 20,
  });
  const pageSize = 20;
  const searchResult = ref<SearchConversationResult>();

  const { action: getConversations, loading } = useAsync<SearchConversationsQuery>(async (args) => {
    searchQuery.value = {
      ...searchQuery.value,
      ...args,
    };

    const command = {
      ...searchQuery.value,
      responseGroup: "Full",
    } as SearchConversationsQuery;

    searchResult.value = await (await conversationClient()).search(command);
  });

  const pagination = useDataTablePagination({
    pageSize,
    totalCount: computed(() => searchResult.value?.totalCount ?? 0),
    onPageChange: ({ skip }) => getConversations({ ...searchQuery.value, skip }),
  });

  return {
    conversations: computed(() => searchResult.value?.results ?? []),
    pagination,
    loading: computed(() => loading.value),
    searchQuery,
    getConversations,
  };
}
