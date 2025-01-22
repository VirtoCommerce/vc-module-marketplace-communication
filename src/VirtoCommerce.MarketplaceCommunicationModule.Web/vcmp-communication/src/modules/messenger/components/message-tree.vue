<template>
  <div
    ref="messageTreeRef"
    class="message-tree"
    :class="{ 'message-tree--mobile': $isMobile.value }"
  >
    <MessageItem
      :message="message"
      :is-target="message.id === targetMessageId"
      :loading="onChangeLoading"
      :is-replies-open="isExpanded"
      @mounted="checkIfTarget"
      @send-reply-message="sendReplyMessage"
      @update-message="update"
      @remove-message="remove"
      @toggle-replies="handleToggleExpand"
      @mark-read="mark"
    />
    <div
      v-if="message.answersCount && message.answersCount > 0"
      class="message-tree__replies-wrapper"
    >
      <div
        v-if="isExpanded"
        ref="repliesContainer"
        class="message-tree__replies"
      >
        <!-- Previous replies loader -->
        <template v-if="!isThreadView">
          <div
            v-if="hasOlderMessages && !(previousLoading || searchMessagesLoading)"
            ref="previousRepliesLoader"
            class="message-tree__loader"
          ></div>
        </template>

        <div
          v-if="hasOlderMessages && (previousLoading || searchMessagesLoading)"
          class="message-tree__loader-content"
        >
          <div
            v-for="n in 10"
            :key="n"
            class="message-tree__reply-branch"
          >
            <div class="message-tree__reply-content">
              <MessageSkeleton />
            </div>
          </div>
        </div>

        <div v-if="childMessages?.length > 0 && searchMessagesLoading">
          <div
            v-for="n in 10"
            :key="n"
            class="message-tree__reply-branch"
          >
            <div class="message-tree__reply-content">
              <MessageSkeleton />
            </div>
          </div>
        </div>
        <template v-else>
          <div
            v-for="(childMessage, index) in childMessages ?? []"
            :key="childMessage.id"
            class="message-tree__reply-branch"
          >
            <div class="message-tree__reply-content">
              <MessageTree
                :message="childMessage"
                :target-message-id="targetMessageId"
                :is-last-child="index === childMessages.length - 1"
                :loading="onChangeLoading"
                :is-thread-view="isThreadView"
                @update-parent-message="updateParentMessage"
                @remove-parent-message="removeParentMessage"
                @mark-read="markAsRead"
                @update="emit('update')"
              />
            </div>
          </div>
        </template>

        <div
          v-if="hasNewerMessages && (nextLoading || searchMessagesLoading)"
          class="message-tree__loader-content"
        >
          <div
            v-for="n in 10"
            :key="n"
            class="message-tree__reply-branch"
          >
            <div class="message-tree__reply-content">
              <MessageSkeleton />
            </div>
          </div>
        </div>

        <!-- Next replies loader -->
        <template v-if="!isThreadView">
          <div
            v-if="hasNewerMessages && !(nextLoading || searchMessagesLoading)"
            ref="nextRepliesLoader"
            class="message-tree__loader"
          ></div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, inject, nextTick } from "vue";
import MessageItem from "./message-item.vue";
import {
  CommunicationUser,
  IDeleteMessageCommand,
  Message,
  MessageAttachment,
  MessageRecipient,
} from "@vcmp-communication/api/marketplacecommunication";
import { useMessages } from "../composables/useMessages";
import MessageSkeleton from "./message-skeleton.vue";
import { useLoading } from "@vc-shell/framework";
import { useInfiniteScroll } from "../composables";

export interface Props {
  message: Message;
  targetMessageId: string | null;
  isThreadView?: boolean;
  isLastChild?: boolean;
  loading?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "message-found", el: HTMLElement): void;
  (e: "search"): void;
  (e: "update-parent-message", message: Message): void;
  (e: "remove-parent-message", message: Message): void;
  (e: "mark-read", args: { messageId: string; recipientId: string }): void;
  (e: "update"): void;
}>();

const {
  searchMessages,
  sendMessage,
  messages,
  loadMoreMessages,
  searchMessagesLoading,
  searchQuery,
  sendMessageLoading,
  hasOlderMessages,
  hasNewerMessages,
  loadPreviousMessages,
  updateMessageLoading,
  markMessageAsRead,
} = useMessages();

const messageTreeRef = ref<HTMLElement | null>(null);
const entityId = inject("entityId") as string;
const entityType = inject("entityType") as string;
const sellerId = inject("sellerId") as string;
const sellerName = inject("sellerName") as string;
const updateMessage = inject("updateMessage") as (args: {
  content: string;
  messageId: string;
  attachments: MessageAttachment[];
}) => Promise<void>;
const removeMessage = inject("removeMessage") as (args: IDeleteMessageCommand) => Promise<void>;
const setActiveForm = inject("setActiveForm") as (
  formType: "main" | "reply" | "edit" | null,
  formId: string | null,
) => void;

const onChangeLoading = useLoading(sendMessageLoading, updateMessageLoading);
const isExpanded = ref(props.isThreadView || false);

watch(
  () => props.isThreadView,
  (newValue) => {
    if (newValue && props.message.answers?.length) {
      isExpanded.value = true;
    }
  },
  { immediate: true },
);

const childMessages = computed(() => {
  return (
    (messages.value?.length ? messages.value : props.message.answers)?.filter(
      (m) => m?.threadId === props.message.id,
    ) || []
  );
});

const repliesContainer = ref<HTMLElement | null>(null);

const page = ref(1);

const isProgrammaticScroll = ref(false);

const hasMoreReplies = ref(true);

watch(isExpanded, (newValue) => {
  if (newValue) {
    hasMoreReplies.value = true;
  }
});

const expandBranch = () => {
  isExpanded.value = true;
};

const handleToggleExpand = async () => {
  isExpanded.value = !isExpanded.value;

  if (isExpanded.value && !props.isThreadView) {
    await searchNestedMessages(props.message.id!);
  }
};

async function searchNestedMessages(threadId: string) {
  await searchMessages({
    // ...searchQuery.value,
    threadId,
    entityId: entityId,
    entityType: entityType,
    responseGroup: "Full",
    conversationId: props.message.conversationId,
  });
}

async function updateParentMessage(message: Message) {
  messages.value = (messages.value?.length ? messages.value : props.message.answers)?.map((m) =>
    m.id === message.id ? message : m,
  );

  emit("update");
}

async function removeParentMessage(message: Message) {
  messages.value = (messages.value?.length ? messages.value : props.message.answers)?.filter(
    (m) => m.id !== message.id,
  );

  const parentMessage = {
    ...props.message,
    answersCount: props.message.answersCount ? props.message.answersCount - 1 : 1,
  };

  emit("update-parent-message", parentMessage as Message);
}

const sendReplyMessage = async (content: {
  content: string;
  replyTo: string | undefined;
  entityId: string;
  entityType: string;
}) => {
  const newMessage = await sendMessage({
    ...content,
    sellerId,
    sellerName,
    threadId: props.message.id,
    conversationId: props.message.conversationId,
  });

  setActiveForm(null, null);

  if (!isExpanded.value) {
    isExpanded.value = true;
  }

  const parentMessage = {
    ...props.message,
    answers: [...(props.message.answers || []), newMessage],
    answersCount: props.message.answersCount ? props.message.answersCount + 1 : 1,
  };

  emit("update-parent-message", parentMessage as Message);

  // Scroll to new message after it's rendered
  if (newMessage) {
    nextTick(() => {
      const messageElement = repliesContainer.value?.querySelector(`[data-message-id="${newMessage.id}"]`);
      if (messageElement) {
        isProgrammaticScroll.value = true;
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

        // Reset flag after animation completes (approximately 300ms for smooth scroll)
        setTimeout(() => {
          isProgrammaticScroll.value = false;
        }, 1000); // Using 1000ms to ensure scroll completes
      }
    });
  }
};

const checkIfTarget = () => {
  if (props.message.id === props.targetMessageId) {
    expandBranch();
    emit("message-found", messageTreeRef.value!);
  }
};

const update = async (args: { content: string; messageId: string; attachments: MessageAttachment[] }) => {
  await updateMessage(args);

  setActiveForm(null, null);

  emit("update-parent-message", {
    ...props.message,
    content: args.content,
    attachments: args.attachments,
  } as Message);
};

const remove = async (args: { messageIds: string[]; withReplies: boolean }) => {
  await removeMessage(args);

  emit("remove-parent-message", props.message);
};

const mark = async (args: { messageId: string; recipientId: string }) => {
  await markMessageAsRead({ ...args, sellerId, sellerName });

  emit("mark-read", { messageId: args.messageId, recipientId: args.recipientId });
};

const markAsRead = (args: { messageId: string; recipientId: string }) => {
  messages.value = messages.value?.map((m) =>
    m.id === args.messageId
      ? new Message({
          ...m,
          recipients: m.recipients?.map((r) =>
            r.recipientId === args.recipientId
              ? new MessageRecipient({ ...r, readStatus: "Read", readTimestamp: new Date() })
              : r,
          ),
        })
      : m,
  );

  emit("mark-read", { messageId: args.messageId, recipientId: args.recipientId });
};

const hasTargetInBranch = computed(() => {
  if (!props.targetMessageId) return false;

  const findTarget = (startMessageId: string): boolean => {
    const stack = [startMessageId];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const currentId = stack.pop()!;

      if (visited.has(currentId)) continue;
      visited.add(currentId);

      if (currentId === props.targetMessageId) return true;

      const children = messages.value?.filter((m) => m.threadId === currentId) || [];
      stack.push(...children.map((c) => c.id!));
    }

    return false;
  };

  return findTarget(props.message.id!);
});

watch(
  () => props.targetMessageId,
  () => {
    if (hasTargetInBranch.value) {
      expandBranch();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (hasTargetInBranch.value) {
    expandBranch();
  }
  checkIfTarget();
});

watch(isExpanded, (newValue) => {
  if (newValue) {
    page.value = 1;
  }
});

const previousRepliesLoader = ref<HTMLElement | null>(null);
const nextRepliesLoader = ref<HTMLElement | null>(null);

watch(hasNewerMessages, (newValue) => {
  if (!newValue) {
    cleanup();
  }
});

const { previousLoading, nextLoading, cleanup } = useInfiniteScroll({
  containerRef: repliesContainer,
  previousLoader: previousRepliesLoader,
  nextLoader: nextRepliesLoader,
  onPreviousIntersection: () => loadPreviousMessages({ threadId: props.message.id }),
  onNextIntersection: () => loadMoreMessages({ ...searchQuery.value, threadId: props.message.id }),
  isProgrammaticScroll,
  hasOlderItems: hasOlderMessages,
  hasNewerItems: hasNewerMessages,
  isLoading: searchMessagesLoading,
});
</script>

<style lang="scss">
:root {
  --empty-communication: var(--empty-grid-icon-color, var(--secondary-500));
}

.message-tree {
  @apply tw-relative;

  &__replies-wrapper {
    @apply tw-mt-1;
  }

  &__replies {
    @apply tw-relative tw-pl-6;
  }

  &__reply-branch {
    @apply tw-relative tw-mt-2;
    &::before {
      content: "";
      @apply tw-absolute tw-left-[-24px] tw-top-0 tw-w-6 tw-h-[28px];
      border-left: 1px solid var(--blade-border-color);
      border-bottom: 1px solid var(--blade-border-color);
      border-bottom-left-radius: 12px;
    }
    &:not(:last-child)::after {
      content: "";
      @apply tw-absolute tw-left-[-24px] tw-top-[18px] tw-bottom-[-10px] tw-w-px tw-bg-[color:var(--blade-border-color)];
    }

    &:last-child::after {
      border-left: none;
    }
  }

  &__reply-content {
    @apply tw-relative;
  }

  &__toggle-button {
    @apply tw-text-xs tw-text-[color:var(--primary-color)] tw-mt-1 tw-mb-2;
  }

  &--mobile {
    @apply tw-w-full;

    .message-tree__replies {
      @apply tw-pl-4;
    }

    .message-tree__reply-branch::before {
      @apply tw-left-[-16px] tw-w-4;
    }

    .message-tree__reply-branch:not(:last-child)::after {
      @apply tw-left-[-16px];
    }
  }

  &__loading {
    @apply tw-text-center tw-py-2 tw-text-sm tw-text-gray-500;
  }

  .message-tree__load-more {
    & ~ .message-tree__reply-branch:last-child::after {
      display: none;
    }
  }

  &__load-more-button {
    @apply tw-mt-2 tw-ml-6 tw-text-xs tw-text-[color:var(--primary-color)];
  }
}
</style>
