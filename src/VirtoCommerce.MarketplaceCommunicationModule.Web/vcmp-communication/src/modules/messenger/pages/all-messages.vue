<template>
  <VcBlade
    :title="title"
    :expanded="expanded"
    :closable="closable"
    width="50%"
    :toolbar-items="bladeToolbar"
    @close="$emit('close:blade')"
    @expand="$emit('expand:blade')"
    @collapse="$emit('collapse:blade')"
  >
    <VcTable
      state-key="conversations"
      :items="conversations"
      :columns="columns"
      :loading="loading"
      :pages="pages"
      :current-page="currentPage"
      :total-count="totalCount"
      :search-value="searchValue"
      :selected-item-id="selectedItemId"
      @search:change="onSearchList"
      @item-click="handleConversationSelect"
      @pagination-click="onPaginationClick"
      @scroll:ptr="reload"
    >
      <template #item_iconUrl="{ item }">
        <VcImage
          v-if="item.iconUrl"
          :src="item.iconUrl"
          rounded
          size="s"
          class="conversations__avatar"
        />
        <VcIcon
          v-else
          class="conversations__avatar"
          icon="fas fa-comments"
        />
      </template>
      <template #item_name="{ item }">
        <div class="conversations__header">
          <div class="conversations__author-info">
            <div class="conversations__author-wrapper">
              <div class="conversations__author-row">
                <span class="conversations__author">{{ item.name }}</span>
                <div class="conversations__type-wrapper">
                  <span class="conversations__type conversations__type--entity">
                    {{ getConversationType(item.entityType) }}
                  </span>
                </div>
              </div>
              <span
                class="conversations__date"
                :title="formatDate(item.lastMessage?.createdDate)"
              >
                {{ dateAgo(item.lastMessage?.createdDate) }}
              </span>

              <VcBadge
                v-if="item.unreadMessagesCount && item.unreadMessagesCount > 0"
                :content="item.unreadMessagesCount"
                class="conversations__badge"
              >
              </VcBadge>
            </div>
          </div>
        </div>

        <div class="conversations__content">
          <div
            v-if="item.lastMessage"
            class="conversations__message"
          >
            <span class="conversations__sender">
              {{
                item.lastMessage.sender?.userName === currentSeller.name
                  ? $t("ALL_MESSAGES.LIST.YOU")
                  : item.lastMessage.sender?.userName
              }}:
            </span>
            <span class="conversations__text">{{ item.lastMessage.content }}</span>
          </div>
        </div>
      </template>

      <template #empty>
        <div class="tw-w-full tw-h-full tw-box-border tw-flex tw-flex-col tw-items-center tw-justify-center">
          <VcIcon
            icon="fas fa-comments"
            class="tw-text-[color:var(--conversations-empty-grid-icon-color)]"
            size="xxxl"
          />
          <div class="tw-m-4 tw-text-xl tw-font-medium">
            {{ $t("ALL_MESSAGES.TABLE.EMPTY.NO_ITEMS") }}
          </div>
        </div>
      </template>

      <template #notfound>
        <div class="tw-w-full tw-h-full tw-box-border tw-flex tw-flex-col tw-items-center tw-justify-center">
          <VcIcon
            icon="fas fa-comments"
            class="tw-text-[color:var(--conversations-empty-grid-icon-color)]"
            size="xxxl"
          />
          <div class="tw-m-4 tw-text-xl tw-font-medium">
            {{ $t("ALL_MESSAGES.TABLE.NOT_FOUND.EMPTY") }}
          </div>
          <VcButton @click="reset">{{ $t("ALL_MESSAGES.TABLE.NOT_FOUND.RESET") }}</VcButton>
        </div>
      </template>
    </VcTable>
  </VcBlade>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject, onMounted, Ref, ref, watch } from "vue";
import { useConversationList } from "../composables";
import {
  IBladeToolbar,
  IParentCallArgs,
  ITableColumns,
  notification,
  useBladeNavigation,
  useNotifications,
} from "@vc-shell/framework";
import type {
  Conversation,
  ISearchConversationsQuery,
} from "../../../api_client/virtocommerce.marketplacecommunication";
import { useI18n } from "vue-i18n";
import { useMounted } from "@vueuse/core";
import { MessagePushNotification, ConversationListType } from "../typings";
import * as _ from "lodash-es";
import { formatDate, dateAgo } from "../utils";

const props = defineProps<{
  expanded?: boolean;
  closable?: boolean;
  param?: string;
  options?: {
    entityId?: string;
    entityType?: string;
    messageId?: string;
  };
}>();

const emit = defineEmits<{
  (event: "parent:call", args: IParentCallArgs): void;
  (event: "close:blade"): void;
  (event: "expand:blade"): void;
  (event: "collapse:blade"): void;
}>();

defineOptions({
  name: "AllMessages",
  notifyType: "MessagePushNotification",
  url: "/communication",
  isWorkspace: true,
  menuItem: {
    title: "ALL_MESSAGES.MENU_TITLE",
    icon: "fas fa-comment",
    priority: 5,
  },
});

const { t } = useI18n({ useScope: "global" });
const { openBlade, resolveBladeByName } = useBladeNavigation();
const { setNotificationHandler } = useNotifications("MessagePushNotification");

setNotificationHandler(async (notify) => {
  const messageNotify = notify as MessagePushNotification;
  notification(messageNotify.title + ": " + messageNotify.content);
  await load();
});

const selectedConversation = ref<Conversation | null | undefined>(null) as Ref<Conversation | null | undefined>;

const { conversations, loading, getConversations, totalCount, pages, currentPage, searchQuery } = useConversationList();

const currentSeller = inject<ComputedRef<{ id: string; name: string }>>("currentSeller");
const isReady = ref(false);
const searchValue = ref();
const selectedItemId = ref<string>();

if (!currentSeller?.value) {
  throw new Error("Seller is not provided");
}

const title = computed(() => t("ALL_MESSAGES.TITLE"));

watch(
  [() => props.param, () => conversations.value, useMounted()],
  ([conversationId, conversations, mounted]) => {
    if (selectedConversation.value) {
      return;
    }
    if (conversations && conversationId && mounted) {
      selectedConversation.value = conversations.find((c) => c.id === conversationId);

      if (selectedConversation.value) {
        handleConversationSelect(selectedConversation.value, props.options?.messageId);
        selectedItemId.value = conversationId;
      }
    } else {
      selectedConversation.value = null;
      selectedItemId.value = undefined;
    }
  },
  { immediate: true },
);

const onPaginationClick = async (page: number) => {
  await loadConversations({
    ...searchQuery.value,
    skip: (page - 1) * (searchQuery.value.take ?? 10),
  });
};

const getConversationType = (entityType?: string) => {
  return entityType ? ConversationListType[entityType as keyof typeof ConversationListType] : null;
};

const onSearchList = _.debounce(async (keyword: string | undefined) => {
  console.debug(`Offers list search by ${keyword}`);
  searchValue.value = keyword;
  await loadConversations({
    ...searchQuery.value,
    keyword,
  });
}, 1000);

const bladeToolbar = computed<IBladeToolbar[]>(() => [
  {
    id: "refresh",
    icon: "fas fa-sync-alt",
    title: t("ALL_MESSAGES.TOOLBAR.REFRESH"),
    clickHandler: reload,
  },
]);

const columns = ref<ITableColumns[]>([
  {
    id: "iconUrl",
    title: computed(() => t("ALL_MESSAGES.TABLE.COLUMNS.ICON_URL")),
    width: "80px",
  },
  {
    id: "name",
    title: computed(() => t("ALL_MESSAGES.TABLE.COLUMNS.NAME")),
  },
]);

function handleConversationSelect(conversation: Conversation, messageId?: string) {
  openBlade({
    blade: resolveBladeByName("Messenger"),
    param: messageId,
    options: {
      conversation,
      entityId: conversation.entityId,
      entityType: conversation.entityType,
    },
    onOpen: () => {
      selectedConversation.value = conversation;
      selectedItemId.value = conversation.id;
    },
    onClose: () => {
      selectedConversation.value = null;
      selectedItemId.value = undefined;
    },
  });
}

async function load() {
  if (currentSeller?.value) {
    await reload();
    isReady.value = true;
  }
}

const reload = async () => {
  await loadConversations({
    ...searchQuery.value,
    skip: (currentPage.value - 1) * (searchQuery.value.take ?? 10),
  });
};

function expandAllReplies() {
  if (selectedConversation.value) {
    handleConversationSelect(selectedConversation.value, undefined);
  }
}

async function loadConversations(query: ISearchConversationsQuery) {
  if (currentSeller?.value) {
    await getConversations({
      ...query,
      sellerId: currentSeller.value.id,
    });
  }
}

async function reset() {
  searchValue.value = "";
  await loadConversations({
    ...searchQuery.value,
    keyword: "",
  });
}

onMounted(async () => {
  await load();
});

defineExpose({
  title,
  refresh: reload,
  expandAllReplies,
});
</script>

<style lang="scss">
:root {
  --conversations-avatar-size: 42px;
  --conversations-author-color: var(--neutrals-400);
  --conversations-date-color: var(--neutrals-500);
  --conversations-empty-grid-icon-color: var(--empty-grid-icon-color, var(--secondary-500));
}

.conversations {
  @apply tw-h-full tw-overflow-y-auto tw-bg-[color:var(--additional-50)];

  &__empty-state {
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-[color:var(--neutrals-500)] tw-gap-3;
  }

  &__empty-icon {
    @apply tw-text-[48px];
  }

  &__list {
    @apply tw-list-none tw-p-0 tw-m-0;
  }

  &__item {
    @apply tw-flex tw-flex-col tw-p-4 tw-cursor-pointer tw-border-b tw-border-[color:var(--neutrals-100)];

    &:hover {
      @apply tw-bg-[color:var(--neutrals-50)];
    }

    &--selected {
      @apply tw-bg-[color:var(--neutrals-50)];
    }

    &--skeleton {
      @apply tw-pointer-events-none;
    }
  }

  &__header {
    @apply tw-flex tw-justify-between tw-items-start tw-w-full;
  }

  &__author-row {
    @apply tw-flex tw-items-center tw-justify-between;
  }

  &__type {
    @apply tw-text-xs tw-px-2 tw-py-0.5 tw-rounded-full tw-font-medium;

    &--entity {
      @apply tw-bg-[color:var(--primary-50)] tw-text-[color:var(--primary-500)];
    }
  }

  &__author-info {
    @apply tw-flex tw-items-start tw-flex-1;
  }

  &__avatar {
    @apply tw-mr-2 tw-text-[length:var(--conversations-avatar-size)] tw-text-[color:var(--conversations-author-color)] #{!important};
  }

  &__author-wrapper {
    @apply tw-flex tw-flex-row tw-gap-1 tw-flex-1 tw-items-center;
  }

  &__author {
    @apply tw-font-semibold tw-text-sm tw-text-[color:var(--base-text-color)];
  }

  &__date {
    @apply tw-text-[color:var(--conversations-date-color)] tw-text-xs;
  }

  &__content {
    @apply tw-mt-2;
  }

  &__message {
    @apply tw-flex tw-gap-1 tw-text-sm tw-text-[color:var(--neutrals-600)];
  }

  &__sender {
    @apply tw-text-[color:var(--neutrals-500)] tw-whitespace-nowrap;
  }

  &__text {
    @apply tw-overflow-hidden tw-text-ellipsis tw-whitespace-nowrap;
  }

  &__badge {
    @apply tw-flex;
    .vc-badge__badge {
      @apply tw-static tw-right-1 -tw-top-1 #{!important};
    }
  }
}
</style>
