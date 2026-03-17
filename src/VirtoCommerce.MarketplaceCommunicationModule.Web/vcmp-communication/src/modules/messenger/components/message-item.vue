<template>
  <div
    ref="messageItemRef"
    class="message-item"
    :class="{
      'message-item--own': isOwnMessage,
    }"
    :data-message-id="message.id"
  >
    <div class="message-item__bubble">
      <!-- Author name (incoming only) -->
      <div v-if="!isOwnMessage" class="message-item__author">
        {{ message.sender?.userName }}
      </div>

      <!-- Quote block -->
      <div
        v-if="message.threadId"
        class="message-item__quote"
        :class="{ 'message-item__quote--clickable': !!quotedMessage }"
        @click="quotedMessage ? emit('scroll-to-quote', message.threadId!) : undefined"
      >
        <template v-if="quoteLoading">
          <span class="message-item__quote-loading">...</span>
        </template>
        <template v-else-if="quotedMessage">
          <span class="message-item__quote-author">{{ quotedMessage.sender?.userName }}</span>
          <span class="message-item__quote-text">{{ quotedMessage.content }}</span>
        </template>
        <template v-else>
          <span class="message-item__quote-unavailable">
            {{ $t("MESSENGER.QUOTE_UNAVAILABLE") }}
          </span>
        </template>
      </div>

      <!-- Content with truncation -->
      <div
        ref="contentRef"
        class="message-item__content"
        :class="{ 'message-item__content--collapsed': !isExpanded }"
      >
        {{ message.content }}
      </div>
      <button v-if="isContentTruncated" class="message-item__expand-btn" @click="isExpanded = !isExpanded">
        {{ isExpanded ? $t("MESSENGER.SHOW_LESS") : $t("MESSENGER.SHOW_MORE") }}
      </button>

      <!-- Attachments -->
      <div v-if="message.attachments?.length" class="message-item__attachments">
        <AssetItem
          v-for="asset in message.attachments"
          :key="asset.id"
          :asset="asset"
          @preview="openImagePreview"
        />
      </div>

      <!-- Timestamp + unread -->
      <div class="message-item__footer">
        <span v-if="isUnread" class="message-item__unread-dot" />
        <span class="message-item__time">{{ formatDate(message.createdDate) }}</span>
      </div>
    </div>

    <!-- Hover toolbar (desktop only) -->
      <MessageHoverToolbar
        v-if="!isMobile"
        class="message-item__toolbar"
        :can-edit="canManage"
        :can-delete="canManage"
        @reply="emit('reply', message)"
        @edit="emit('start-edit', message.id!)"
        @delete="handleDelete"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, nextTick, watch, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { usePopup } from "@vc-shell/framework";
import { Message, MessageAttachment } from "@vcmp-communication/api/marketplacecommunication";
import { useElementVisibility } from "@vueuse/core";
import { formatDate } from "../utils";
import { ImagePreviewPopup, AssetItem } from "./";
import { useMessageActions } from "../composables";
import { messengerStoreKey } from "../injection-keys";
import MessageHoverToolbar from "./message-hover-toolbar.vue";

const props = defineProps<{
  message: Message;
  isMobile: boolean;
}>();

const emit = defineEmits<{
  reply: [message: Message];
  "start-edit": [messageId: string];
  deleted: [];
  "scroll-to-quote": [messageId: string];
}>();

const { t } = useI18n();
const store = inject(messengerStoreKey)!;
const { remove, markAsRead } = useMessageActions();
const { showConfirmation } = usePopup();

// --- Refs ---
const messageItemRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const isExpanded = ref(false);
const isContentTruncated = ref(false);

// --- Computed ---
const isOwnMessage = computed(
  () => store.seller.value?.userId === props.message.sender?.userId,
);

const canManage = computed(
  () => store.seller.value?.userId === props.message.sender?.userId && props.message.answersCount === 0,
);

const isUnread = computed(() => {
  if (!props.message.recipients || props.message.senderId === store.seller.value?.id) return false;
  const recipient = props.message.recipients.find((r) => r.recipientId === store.seller.value?.id);
  return recipient?.readStatus === "New";
});

// --- Quote resolution ---
const quotedMessage = ref<Message | null>(null);
const quoteLoading = ref(false);

if (props.message.threadId) {
  quoteLoading.value = true;
  store.getQuotedMessage(props.message.threadId).then((msg) => {
    quotedMessage.value = msg;
    quoteLoading.value = false;
  });
}

// --- Content truncation ---
let resizeObserver: ResizeObserver | null = null;

function checkTruncation() {
  if (!contentRef.value) return;
  const el = contentRef.value;
  const lineHeight = parseFloat(window.getComputedStyle(el).lineHeight);
  isContentTruncated.value = el.scrollHeight > lineHeight * 4;
}

onMounted(() => {
  nextTick(() => {
    if (contentRef.value) {
      resizeObserver = new ResizeObserver(checkTruncation);
      resizeObserver.observe(contentRef.value);
    }
    checkTruncation();
  });
});

watch(() => props.message.content, () => nextTick(checkTruncation));

onBeforeUnmount(() => resizeObserver?.disconnect());

// --- Image preview ---
const activeAsset = ref<MessageAttachment | null>(null);

const decodeFileUrl = (url: string | undefined) => {
  if (!url) return "";
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

const { open: openPopup, close: closePopup } = usePopup({
  component: ImagePreviewPopup,
  emits: {
    onClose: () => {
      activeAsset.value = null;
      closePopup();
    },
  },
  props: {
    src: computed(() => decodeFileUrl(activeAsset.value?.attachmentUrl)),
    alt: computed(() => activeAsset.value?.fileName),
  },
});

function openImagePreview(asset: MessageAttachment) {
  activeAsset.value = asset;
  openPopup();
}

// --- Delete ---
async function handleDelete() {
  if (await showConfirmation(computed(() => t("MESSENGER.DELETE_CONFIRMATION")))) {
    await remove([props.message.id!], true);
    emit("deleted");
  }
}

// --- Auto mark-as-read (2s visibility delay) ---
const isProgrammaticScroll = inject("isProgrammaticScroll", ref(false));
const isVisible = useElementVisibility(messageItemRef);
let readTimer: ReturnType<typeof setTimeout> | null = null;

function delayedMarkRead() {
  if (isProgrammaticScroll.value || !isUnread.value) return;
  readTimer = setTimeout(() => {
    if (props.message.id && store.seller.value?.id) {
      markAsRead(props.message.id, store.seller.value.id);
    }
  }, 2000);
}

watch(
  [isVisible, isUnread],
  ([visible, unread]) => {
    if (visible && unread) delayedMarkRead();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (readTimer) clearTimeout(readTimer);
});
</script>

<style lang="scss">
.message-item {
  display: flex;
  justify-content: flex-start;
  padding: 4px 16px;
  position: relative;

  &--own {
    justify-content: flex-end;

    .message-item__bubble {
      background-color: var(--primary-50, #eff6ff);
      border-color: var(--primary-200, #bfdbfe);
    }
  }

  &--highlight .message-item__bubble {
    animation: message-highlight 2s ease-out;
  }

  &__bubble {
    max-width: 70%;
    min-width: 120px;
    padding: 8px 12px;
    border-radius: 12px;
    background-color: var(--neutral-50, #f8fafc);
    border: 1px solid var(--neutral-200, #e2e8f0);
    position: relative;
  }

  &__author {
    font-size: 13px;
    font-weight: 600;
    color: var(--primary-600, #2563eb);
    margin-bottom: 2px;
  }

  &__quote {
    background-color: var(--neutral-100, #f1f5f9);
    border-left: 3px solid var(--primary-400, #60a5fa);
    border-radius: 4px;
    padding: 4px 8px;
    margin-bottom: 4px;
    overflow: hidden;

    &--clickable {
      cursor: pointer;

      &:hover {
        background-color: var(--neutral-200, #e2e8f0);
      }
    }
  }

  &__quote-author {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-600, #2563eb);
  }

  &__quote-text {
    display: block;
    font-size: 12px;
    color: var(--neutral-600, #475569);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__quote-unavailable {
    font-size: 12px;
    font-style: italic;
    color: var(--neutral-400, #94a3b8);
  }

  &__quote-loading {
    font-size: 12px;
    color: var(--neutral-400, #94a3b8);
  }

  &__content {
    font-size: 14px;
    line-height: 1.4;
    word-break: break-word;

    &--collapsed {
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  &__expand-btn {
    font-size: 12px;
    color: var(--primary-500);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    margin-top: 2px;
  }

  &__attachments {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 4px;
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 4px;
  }

  &__time {
    font-size: 11px;
    color: var(--neutral-400, #94a3b8);
  }

  &__unread-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--primary-500);
  }

  &__toolbar {
    position: absolute;
    top: -12px;
    right: 4px;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 1;
  }

  &__bubble:hover &__toolbar {
    opacity: 1;
  }
}

@keyframes message-highlight {
  0% {
    background-color: var(--warning-100, #fef3c7);
  }
  100% {
    background-color: transparent;
  }
}
</style>
