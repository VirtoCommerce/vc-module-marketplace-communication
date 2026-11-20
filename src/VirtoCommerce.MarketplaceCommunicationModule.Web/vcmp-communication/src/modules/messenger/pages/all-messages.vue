<template>
  <VcBlade
    :title="title"
    width="50%"
    :toolbar-items="bladeToolbar"
  >
    <div class="chat-list">
      <!-- Search -->
      <div class="chat-list__search">
        <VcInput
          v-model="searchValue"
          :placeholder="$t('MESSENGER.SEARCH.PLACEHOLDER')"
          :clearable="true"
          class="chat-list__search-input"
          @update:model-value="onSearchInput"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="chat-list__loading"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="chat-list__skeleton"
        >
          <div class="chat-list__skeleton-avatar" />
          <div class="chat-list__skeleton-content">
            <!-- Top row: name + type badge + time (mirrors chat-item__top) -->
            <div class="chat-list__skeleton-row">
              <div class="chat-list__skeleton-name" />
              <div class="chat-list__skeleton-badge" />
              <span class="tw-flex-1" />
              <div class="chat-list__skeleton-time" />
            </div>
            <!-- Bottom row: preview text (mirrors chat-item__bottom) -->
            <div class="chat-list__skeleton-row">
              <div class="chat-list__skeleton-preview" />
            </div>
          </div>
        </div>
      </div>

      <!-- Conversation list -->
      <div
        v-else-if="conversations?.length"
        class="chat-list__items"
      >
        <div
          v-for="conv in conversations"
          :key="conv.id"
          class="chat-item"
          :class="{ 'chat-item--active': selectedItemId === conv.id }"
          @click="selectConversation(conv)"
        >
          <!-- Avatar -->
          <div class="chat-item__avatar">
            <VcImage
              v-if="conv.iconUrl"
              :src="conv.iconUrl"
              size="s"
            />
            <VcIcon
              v-else
              icon="lucide-messages-square"
              size="l"
            />
          </div>

          <!-- Content -->
          <div class="chat-item__body">
            <div class="chat-item__top">
              <span class="chat-item__name">{{ conv.name }}</span>
              <span
                v-if="conv.entityType"
                class="chat-item__type"
                >{{ getConversationType(conv.entityType) }}</span
              >
              <span class="tw-flex-1" />
              <span
                v-if="conv.lastMessage?.createdDate"
                class="chat-item__time"
                :title="formatDate(conv.lastMessage.createdDate)"
                >{{ dateAgo(conv.lastMessage.createdDate) }}</span
              >
            </div>
            <div class="chat-item__bottom">
              <span
                v-if="conv.lastMessage"
                class="chat-item__preview"
              >
                <span class="chat-item__sender">
                  {{ isOwnSender(conv.lastMessage) ? $t("ALL_MESSAGES.LIST.YOU") : conv.lastMessage.sender?.userName }}:
                </span>
                {{ conv.lastMessage.content }}
              </span>
              <span class="tw-flex-1" />
              <span
                v-if="conv.unreadMessagesCount && conv.unreadMessagesCount > 0"
                class="chat-item__unread"
                >{{ conv.unreadMessagesCount }}</span
              >
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div
          v-if="pagination.pages > 1"
          class="chat-list__pagination"
        >
          <VcButton
            small
            icon="lucide-chevron-left"
            :disabled="pagination.currentPage <= 1"
            @click="pagination.goToPage(pagination.currentPage - 1)"
          />
          <span class="chat-list__page-info">{{ pagination.currentPage }} / {{ pagination.pages }}</span>
          <VcButton
            small
            icon="lucide-chevron-right"
            :disabled="pagination.currentPage >= pagination.pages"
            @click="pagination.goToPage(pagination.currentPage + 1)"
          />
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-else
        class="chat-list__empty"
      >
        <VcIcon
          icon="lucide-messages-square"
          size="xxl"
          class="tw-text-[color:var(--neutrals-300)]"
        />
        <span class="chat-list__empty-text">
          {{ searchValue ? $t("ALL_MESSAGES.TABLE.NOT_FOUND.EMPTY") : $t("ALL_MESSAGES.TABLE.EMPTY.NO_ITEMS") }}
        </span>
        <VcButton
          v-if="searchValue"
          text
          small
          @click="resetSearch"
        >
          {{ $t("ALL_MESSAGES.TABLE.NOT_FOUND.RESET") }}
        </VcButton>
      </div>
    </div>
  </VcBlade>
</template>

<script setup lang="ts">
import { computed, onMounted, Ref, ref, watch } from "vue";
import { useConversationList, useConversationApi, useUserApi } from "../composables";
import { IBladeToolbar, useBlade, useBladeNotifications } from "@vc-shell/framework";
import type {
  CommunicationUser,
  Conversation,
  Message,
  SearchConversationsQuery,
} from "../../../api_client/virtocommerce.marketplacecommunication";
import { useI18n } from "vue-i18n";
import { useMounted, useDebounceFn } from "@vueuse/core";
import { ConversationListType } from "../typings";
import { useMessengerIdentity } from "../identity";
import { formatDate, dateAgo } from "../utils";

import { VcBlade, VcButton, VcIcon, VcImage, VcInput } from "@vc-shell/framework/ui";

// legacy conversation-list
defineBlade({
  name: "AllMessages",
  url: "/communication",
  isWorkspace: true,
  permissions: ["seller:message:read"],
  menuItem: {
    title: "ALL_MESSAGES.MENU_TITLE",
    icon: "lucide-message-circle",
    priority: 5,
  },
});

const { t } = useI18n({ useScope: "global" });

const { openBlade, exposeToChildren, options, param } = useBlade<{
  entityId?: string;
  entityType?: string;
  messageId?: string;
}>();

// the notification's own toast announces the message; the list only refreshes its last messages and counts
useBladeNotifications({
  types: ["MessagePushNotification"],
  onMessage: load,
});

const selectedConversation = ref<Conversation | null | undefined>(null) as Ref<Conversation | null | undefined>;

const { conversations, loading, getConversations, pagination, searchQuery } = useConversationList();

const { createConversation } = useConversationApi();
const { getOperator } = useUserApi();
const operator = ref<CommunicationUser>();

const identity = useMessengerIdentity();
const isOperator = identity.role === "operator";
const currentSeller = identity.seller;
const isReady = ref(false);
const searchValue = ref("");
const selectedItemId = ref<string>();

if (!isOperator && !currentSeller.value) {
  throw new Error("Seller is not provided");
}

// The seller recognizes itself by name (as before); the operator by its communication user
function isOwnSender(message: Message) {
  return isOperator
    ? !!operator.value?.id && message.senderId === operator.value.id
    : message.sender?.userName === currentSeller.value?.name;
}

const title = computed(() => t("ALL_MESSAGES.TITLE"));

watch(
  [() => param.value, () => conversations.value, useMounted()],
  ([conversationId, conversations, mounted]) => {
    if (selectedConversation.value) return;
    if (conversations && conversationId && mounted) {
      selectedConversation.value = conversations.find((c) => c.id === conversationId);
      if (selectedConversation.value) {
        selectConversation(selectedConversation.value, options.value?.messageId);
        selectedItemId.value = conversationId;
      }
    } else {
      selectedConversation.value = null;
      selectedItemId.value = undefined;
    }
  },
  { immediate: true },
);

const getConversationType = (entityType?: string) => {
  return entityType ? ConversationListType[entityType as keyof typeof ConversationListType] : null;
};

const debouncedSearch = useDebounceFn(async (keyword: string | undefined) => {
  await loadConversations({
    ...searchQuery.value,
    keyword,
  });
}, 500);

function onSearchInput() {
  debouncedSearch(searchValue.value || undefined);
}

const bladeToolbar = computed<IBladeToolbar[]>(() => [
  {
    id: "refresh",
    icon: "lucide-refresh-cw",
    title: t("ALL_MESSAGES.TOOLBAR.REFRESH"),
    clickHandler: reload,
  },
  // the seller's direct line to the marketplace; the operator starts conversations from a vendor's widget
  ...(isOperator
    ? []
    : [
        {
          id: "operator-chat",
          icon: "lucide-message-circle",
          title: t("ALL_MESSAGES.TOOLBAR.OPERATOR_CHAT"),
          clickHandler: async () => {
            try {
              const conversation = await createConversation({
                sellerId: currentSeller.value?.id ?? "",
                sellerName: currentSeller.value?.name ?? "",
                userIds: [operator.value?.id ?? ""],
              });
              await openBlade({
                name: "Messenger",
                options: { conversation },
              });
            } catch (error) {
              console.error(error);
            }
          },
        },
      ]),
]);

function selectConversation(conversation: Conversation, messageId?: string) {
  openBlade({
    name: "Messenger",
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
  if (isOperator || currentSeller.value) {
    await reload();
    isReady.value = true;
  }
}

const reload = async () => {
  await loadConversations({
    ...searchQuery.value,
    skip: pagination.skip,
  });
};

async function loadConversations(query: SearchConversationsQuery) {
  if (isOperator) {
    // legacy conversation-list: the operator's conversations, by its communication user
    operator.value ??= await getOperator();
    if (operator.value?.id) {
      await getConversations({ ...query, userIds: [operator.value.id] });
    }
  } else if (currentSeller.value) {
    await getConversations({
      ...query,
      sellerId: currentSeller.value.id,
    });
  }
}

async function resetSearch() {
  searchValue.value = "";
  await loadConversations({
    ...searchQuery.value,
    keyword: "",
  });
}

onMounted(async () => {
  await load();
  operator.value ??= await getOperator();
});

exposeToChildren({ refresh: reload });
</script>

<style lang="scss">
.chat-list {
  @apply tw-flex tw-flex-col tw-h-full;
  @apply tw-bg-[color:var(--additional-50)];

  &__search {
    @apply tw-px-4 tw-py-3;
    @apply tw-border-b tw-border-solid tw-border-[color:var(--neutrals-100)];
    @apply tw-bg-[color:var(--blade-background-color)];
  }

  &__search-input {
    @apply tw-w-full;
  }

  &__items {
    @apply tw-flex-1 tw-overflow-y-auto;
  }

  &__loading {
    @apply tw-flex-1 tw-overflow-hidden tw-p-2;
  }

  &__skeleton {
    // Mirrors .chat-item layout
    @apply tw-flex tw-items-start tw-gap-3 tw-px-4 tw-py-3;
    @apply tw-border-b tw-border-solid tw-border-[color:var(--neutrals-50)];

    &-avatar {
      // Mirrors .chat-item__avatar: 10x10 rounded square
      @apply tw-w-10 tw-h-10 tw-rounded-[6px] tw-flex-shrink-0;
      @apply tw-bg-[color:var(--neutrals-100)];
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    &-content {
      // Mirrors .chat-item__body
      @apply tw-flex tw-flex-col tw-gap-1.5 tw-flex-1 tw-min-w-0;
    }

    &-row {
      @apply tw-flex tw-items-center tw-gap-2;
    }

    &-name {
      @apply tw-h-3.5 tw-w-28 tw-rounded;
      @apply tw-bg-[color:var(--neutrals-100)];
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    &-badge {
      @apply tw-h-4 tw-w-14 tw-rounded-full;
      @apply tw-bg-[color:var(--neutrals-100)];
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    &-time {
      @apply tw-h-3 tw-w-10 tw-rounded tw-flex-shrink-0;
      @apply tw-bg-[color:var(--neutrals-100)];
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }

    &-preview {
      @apply tw-h-3 tw-w-4/5 tw-rounded;
      @apply tw-bg-[color:var(--neutrals-100)];
      animation: skeleton-pulse 1.5s ease-in-out infinite;
    }
  }

  &__empty {
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-3;
    @apply tw-flex-1 tw-py-12;
  }

  &__empty-text {
    @apply tw-text-sm tw-text-[color:var(--neutrals-500)];
  }

  &__pagination {
    @apply tw-flex tw-items-center tw-justify-center tw-gap-3;
    @apply tw-py-3;
    @apply tw-border-t tw-border-solid tw-border-[color:var(--neutrals-100)];
  }

  &__page-info {
    @apply tw-text-xs tw-text-[color:var(--neutrals-500)];
  }
}

.chat-item {
  @apply tw-flex tw-items-start tw-gap-3;
  @apply tw-px-4 tw-py-3;
  @apply tw-cursor-pointer;
  @apply tw-border-b tw-border-solid tw-border-[color:var(--neutrals-50)];
  @apply tw-transition-colors;

  &:hover {
    @apply tw-bg-[color:var(--neutrals-50)];
  }

  &--active {
    @apply tw-bg-[color:var(--primary-50)];

    &:hover {
      @apply tw-bg-[color:var(--primary-50)];
    }
  }

  &__avatar {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-10 tw-h-10 tw-flex-shrink-0;
    @apply tw-rounded-[6px];
    @apply tw-bg-[color:var(--neutrals-100)] tw-text-[color:var(--neutrals-400)];
    @apply tw-overflow-hidden;
  }

  &__body {
    @apply tw-flex tw-flex-col tw-flex-1 tw-min-w-0 tw-gap-0.5;
  }

  &__top {
    @apply tw-flex tw-items-center tw-gap-2;
  }

  &__name {
    @apply tw-font-semibold tw-text-sm tw-text-[color:var(--neutrals-900)];
    @apply tw-truncate;
  }

  &__type {
    @apply tw-text-[11px] tw-leading-none tw-px-1.5 tw-py-0.5 tw-rounded-full tw-font-medium tw-flex-shrink-0;
    @apply tw-bg-[color:var(--primary-50)] tw-text-[color:var(--primary-500)];
  }

  &__time {
    @apply tw-text-xs tw-text-[color:var(--neutrals-400)] tw-flex-shrink-0 tw-whitespace-nowrap;
  }

  &__bottom {
    @apply tw-flex tw-items-center tw-gap-2;
  }

  &__preview {
    @apply tw-text-[13px] tw-text-[color:var(--neutrals-500)];
    @apply tw-truncate;
  }

  &__sender {
    @apply tw-text-[color:var(--neutrals-400)];
  }

  &__unread {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-min-w-[20px] tw-h-5 tw-px-1.5;
    @apply tw-rounded-full tw-flex-shrink-0;
    @apply tw-bg-[color:var(--primary-500)] tw-text-white;
    @apply tw-text-[11px] tw-font-semibold;
  }
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
