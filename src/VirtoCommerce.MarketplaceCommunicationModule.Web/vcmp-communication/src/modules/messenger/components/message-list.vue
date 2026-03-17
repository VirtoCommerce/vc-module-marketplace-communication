<template>
  <div class="message-list">
    <div
      ref="scrollContainer"
      class="message-list__scroll"
    >
      <!-- Previous messages loader sentinel -->
      <div
        v-if="store.hasOlderMessages.value"
        ref="previousLoader"
        class="message-list__sentinel"
      >
        <MessageSkeleton v-if="previousLoading" />
      </div>

      <!-- Loading state -->
      <template v-if="store.searchMessagesLoading.value && !store.messages.value.length">
        <MessageSkeleton
          v-for="n in 5"
          :key="'init-' + n"
        />
      </template>

      <!-- Messages -->
      <template v-else-if="store.messages.value.length">
        <template
          v-for="message in store.messages.value"
          :key="message.id"
        >
          <!-- If editing this message, show form -->
          <MessageForm
            v-if="editingMessageId === message.id"
            mode="edit"
            :message="message"
            @send="handleEditSave($event, message)"
            @cancel="editingMessageId = undefined"
          />
          <!-- Otherwise show message item -->
          <MessageItem
            v-else
            :message="message"
            :is-mobile="$isMobile.value"
            @reply="handleReply(message)"
            @start-edit="editingMessageId = $event"
            @deleted="refreshMessages"
            @scroll-to-quote="scrollToMessage"
          />
        </template>
      </template>

      <!-- Empty state -->
      <div
        v-else-if="!store.searchMessagesLoading.value"
        class="message-list__empty"
      >
        <VcIcon
          icon="lucide-message-square"
          size="xl"
        />
        <span>{{ $t("messenger.no_messages") }}</span>
      </div>

      <!-- Next messages loader sentinel -->
      <div
        v-if="store.hasNewerMessages.value"
        ref="nextLoader"
        class="message-list__sentinel"
      >
        <MessageSkeleton v-if="nextLoading" />
      </div>
    </div>

    <!-- New message form at bottom -->
    <div class="message-list__form">
      <MessageForm
        mode="new"
        :reply-to="replyToMessage"
        @send="handleSend"
        @cancel="cancelReply"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, provide } from "vue";
import { useMessengerStore, useMessageActions } from "../composables";
import { useInfiniteScroll } from "../composables/useInfiniteScroll";
import { messengerContextKey } from "../injection-keys";
import MessageItem from "./message-item.vue";
import MessageForm from "./message-form.vue";
import MessageSkeleton from "./message-skeleton.vue";
import { Message, MessageAttachment } from "@vcmp-communication/api/marketplacecommunication";

const store = useMessengerStore();
const actions = useMessageActions();
const ctx = inject(messengerContextKey)!;

const editingMessageId = ref<string | undefined>(undefined);
const scrollContainer = ref<HTMLElement | null>(null);
const previousLoader = ref<HTMLElement | null>(null);
const nextLoader = ref<HTMLElement | null>(null);
const isProgrammaticScroll = ref(false);
const replyToMessage = ref<Message | null>(null);

provide("isProgrammaticScroll", isProgrammaticScroll);

const { previousLoading, nextLoading } = useInfiniteScroll({
  containerRef: scrollContainer,
  previousLoader,
  nextLoader,
  onPreviousIntersection: () => store.loadPreviousMessages(),
  onNextIntersection: () => store.loadMoreMessages({ ...store.searchQuery.value }),
  isProgrammaticScroll,
  hasOlderItems: store.hasOlderMessages,
  hasNewerItems: store.hasNewerMessages,
  isLoading: store.searchMessagesLoading,
});

function handleReply(message: Message) {
  replyToMessage.value = message;
}

function cancelReply() {
  replyToMessage.value = null;
}

function scrollToMessage(messageId: string) {
  const el = scrollContainer.value?.querySelector(`[data-message-id="${messageId}"]`) as HTMLElement | null;
  if (el) {
    isProgrammaticScroll.value = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("message-item--highlight");
    setTimeout(() => {
      el.classList.remove("message-item--highlight");
      isProgrammaticScroll.value = false;
    }, 2000);
  } else {
    // Phase 2: load messages until found
    // For now, log a warning — MESSAGE_NOT_LOADED i18n key is ready for proper toast
    console.warn(`Message ${messageId} not found in DOM`);
  }
}

async function handleSend(payload: { content: string; attachments: MessageAttachment[] }) {
  const replyTo = replyToMessage.value?.id;
  await actions.send({
    content: payload.content,
    attachments: payload.attachments,
    ...(replyTo ? { replyTo } : {}),
    conversationId: ctx.conversation.value?.id,
  });
  replyToMessage.value = null;
}

async function refreshMessages() {
  await store.loadMessages({ ...store.searchQuery.value, conversationId: ctx.conversation.value?.id });
}

async function handleEditSave(args: { content: string; attachments: MessageAttachment[] }, message: Message) {
  await actions.update({
    messageId: message.id!,
    content: args.content,
    attachments: args.attachments,
  });
  editingMessageId.value = undefined;
  await store.loadMessages({ ...store.searchQuery.value, conversationId: ctx.conversation.value?.id });
}
</script>

<style lang="scss">
.message-list {
  @apply tw-flex tw-flex-col tw-h-full tw-overflow-hidden;

  &__scroll {
    @apply tw-flex-1 tw-overflow-y-auto;
    @apply tw-p-4 tw-flex tw-flex-col tw-gap-2;
  }

  &__form {
    @apply tw-px-4 tw-py-3;
    @apply tw-border-t tw-border-solid tw-border-[color:var(--neutrals-100)];
    @apply tw-bg-[color:var(--blade-background-color)];
  }

  &__empty {
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-py-12 tw-flex-1;
  }

  &__sentinel {
    @apply tw-h-1;
  }

  &__loading {
    @apply tw-flex tw-flex-col tw-gap-2;
  }
}
</style>
