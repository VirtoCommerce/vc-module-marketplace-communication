<template>
  <div
    ref="containerRef"
    class="conversation-list"
  >
    <div
      v-if="!conversations.length && !isLoading"
      class="conversation-list__empty-state"
    >
      <VcIcon
        icon="fas fa-comment"
        class="tw-text-[color:var(--products-empty-grid-icon-color)]"
        size="xxxl"
      />
      <div class="tw-m-4 tw-text-xl tw-font-medium">
        {{ $t("ALL_MESSAGES.LIST.NO-DATA") }}
      </div>
    </div>

    <div
      v-else-if="!nextLoading && isLoading"
      class="conversation-list__loader-content"
    >
      <MessageSkeleton
        v-for="n in 10"
        :key="'skeleton-' + n"
      />
    </div>

    <ul
      v-else
      class="conversation-list__list"
    >
      <li
        v-for="conversation in conversations"
        :key="conversation.id"
        class="conversation-list__item"
        :class="{ 'conversation-list__item--selected': conversation.id === selectedConversation?.id }"
        @click="$emit('select', conversation)"
      >
        <div class="conversation-list__header">
          <div class="conversation-list__author-info">
            <VcImage
              v-if="conversation.iconUrl"
              :src="conversation.iconUrl"
              rounded
              size="s"
              class="conversation-list__avatar"
            />
            <VcIcon
              v-else
              class="conversation-list__avatar"
              icon="fas fa-comments"
            />
            <div class="conversation-list__author-wrapper">
              <div class="conversation-list__author-row">
                <span class="conversation-list__author">{{ conversation.name }}</span>
                <span
                  class="conversation-list__date"
                  :title="formatDate(conversation.lastMessage?.createdDate)"
                >
                  {{ dateAgo(conversation.lastMessage?.createdDate) }}
                </span>
              </div>
              <div class="conversation-list__type-wrapper">
                <span class="conversation-list__type conversation-list__type--entity">
                  {{ getConversationType(conversation.entityType) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="conversation-list__content">
          <div
            v-if="conversation.lastMessage"
            class="conversation-list__message"
          >
            <span class="conversation-list__sender">
              {{
                conversation.lastMessage.sender?.userName === userName
                  ? $t("ALL_MESSAGES.LIST.YOU")
                  : conversation.lastMessage.sender?.userName
              }}:
            </span>
            <span class="conversation-list__text">{{ conversation.lastMessage.content }}</span>
          </div>
        </div>
      </li>

      <div
        v-if="(nextLoading || isLoading) && hasMore"
        class="conversation-list__loader-content"
      >
        <MessageSkeleton
          v-for="n in 10"
          :key="'skeleton-' + n"
        />
      </div>

      <div
        v-if="hasMore && !(nextLoading || isLoading)"
        ref="nextLoader"
        class="conversation-list__loader"
      />
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { Conversation } from "./../../../api_client/virtocommerce.marketplacecommunication";
import { formatDate, dateAgo } from "../utils";
import { useInfiniteScroll } from "../composables/useInfiniteScroll";
import { ConversationListType } from "../typings";

const props = defineProps<{
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  userName: string;
  isLoading: boolean;
  hasMore: boolean;
}>();

const emit = defineEmits<{
  (e: "select", conversation: Conversation): void;
  (e: "load-more"): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const nextLoader = ref<HTMLElement | null>(null);
const isProgrammaticScroll = ref(false);

const { nextLoading } = useInfiniteScroll({
  containerRef,
  previousLoader: ref(null),
  nextLoader,
  onPreviousIntersection: async () => false,
  onNextIntersection: async () => {
    emit("load-more");
    return true;
  },
  isProgrammaticScroll,
  hasOlderItems: ref(false),
  hasNewerItems: computed(() => props.hasMore),
  isLoading: computed(() => props.isLoading),
});

const getConversationType = (entityType?: string) => {
  return entityType ? ConversationListType[entityType as keyof typeof ConversationListType] : null;
};
</script>

<style lang="scss">
:root {
  --conversation-list-avatar-size: 42px;
  --conversation-list-author-color: var(--neutrals-400);
  --conversation-list-date-color: var(--neutrals-500);
}

.conversation-list {
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
    @apply tw-mr-2 tw-text-[length:var(--conversation-list-avatar-size)] tw-text-[color:var(--conversation-list-author-color)] #{!important};
  }

  &__author-wrapper {
    @apply tw-flex tw-flex-col tw-gap-1 tw-flex-1;
  }

  &__author {
    @apply tw-font-semibold tw-text-sm tw-text-[color:var(--base-text-color)];
  }

  &__date {
    @apply tw-text-[color:var(--conversation-list-date-color)] tw-text-xs;
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

  @keyframes skeleton-loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .skeleton-base {
    @apply tw-bg-gradient-to-r tw-from-[color:var(--neutrals-100)] tw-via-[color:var(--neutrals-50)] tw-to-[color:var(--neutrals-100)];
    background-size: 200% 100%;
    animation: skeleton-loading 1.5s infinite linear;
  }

  &__avatar--skeleton {
    @apply tw-w-[var(--conversation-list-avatar-size)] tw-h-[var(--conversation-list-avatar-size)] tw-rounded-full;
    @extend .skeleton-base;
  }

  &__author--skeleton {
    @apply tw-h-4 tw-w-32 tw-rounded;
    @extend .skeleton-base;
  }

  &__date--skeleton {
    @apply tw-h-3 tw-w-20 tw-rounded;
    @extend .skeleton-base;
  }

  &__message--skeleton {
    @apply tw-h-4 tw-w-full tw-rounded tw-mt-2;
    @extend .skeleton-base;
  }

  &__loader {
    @apply tw-h-[50px] tw-w-full;
  }

  &__loader-content {
    @apply tw-w-full;
  }
}
</style>
