<template>
  <div
    ref="messageItemRef"
    class="message-item"
    :class="{
      'message-item--target': isTarget,
      'message-item--highlight': isHighlighted,
      'message-item--mobile': $isMobile.value,
    }"
    :data-message-id="message.id"
  >
    <div class="message-item__main">
      <div class="message-item__header">
        <div class="message-item__author-info">
          <VcImage
            v-if="message.sender?.avatarUrl"
            :src="message.sender?.avatarUrl"
            rounded
            size="s"
            class="message-item__avatar"
          />
          <VcIcon
            v-else
            class="message-item__avatar"
            icon="material-account_circle"
          />
          <div class="message-item__author-info-wrapper">
            <div class="message-item__author-row">
              <span class="message-item__author">{{ message.sender?.userName || message.senderId }}</span>
              <span
                v-if="isUnread"
                class="message-item__unread-indicator"
                :title="$t('MESSENGER.UNREAD_MESSAGE')"
              />
            </div>
            <span
              class="message-item__date"
              :title="formatDate(message.createdDate)"
              >{{ dateAgo(message.createdDate) }}</span
            >
          </div>
        </div>
      </div>
      <div
        v-if="!isEditFormVisible"
        class="message-item__content-wrapper"
      >
        <div
          ref="contentRef"
          class="message-item__content"
          :class="{ 'message-item__content--collapsed': !isExpanded }"
        >
          {{ message.content }}
        </div>

        <div
          v-if="isContentTruncated"
          class="message-item__content-overlay"
          :class="{ 'message-item__content-overlay--expanded': isExpanded }"
        >
          <div
            v-if="!isExpanded"
            class="message-item__gradient"
          ></div>
          <VcButton
            text
            :icon="isExpanded ? 'material-keyboard_arrow_up' : 'material-keyboard_arrow_down'"
            class="message-item__expand-button"
            @click="toggleExpand"
          >
            {{ isExpanded ? $t("MESSENGER.SHOW_LESS") : $t("MESSENGER.SHOW_MORE") }}
          </VcButton>
        </div>
        <div
          v-if="message.attachments?.length"
          class="message-item__assets"
        >
          <div class="message-item__assets-list">
            <AssetItem
              v-for="asset in visibleAssets"
              :key="asset.id"
              :asset="asset"
              class="message-item__asset"
              show-size
              @preview="openImagePreview"
            />
          </div>
          <VcButton
            v-if="hasHiddenAssets"
            type="button"
            text
            small
            class="new-message-form__assets-toggle"
            @click="toggleAssetsList"
          >
            {{
              isAssetsExpanded
                ? $t("MESSENGER.SHOW_LESS")
                : $t("MESSENGER.SHOW_MORE", { count: (props.message.attachments?.length ?? 0) - MAX_ASSETS_COUNT })
            }}
          </VcButton>
        </div>
      </div>
      <div
        v-if="!isEditFormVisible && !isReplyFormVisible"
        class="message-item__footer"
      >
        <div class="message-item__actions">
          <VcButton
            small
            icon="material-reply"
            class="message-item__reply-button"
            @click="showReplyForm"
          >
            {{ $t("MESSENGER.REPLY") }}
          </VcButton>
          <VcButton
            v-if="canManageMessage"
            small
            icon="material-edit"
            class="message-item__edit-button"
            @click="showEditForm"
          >
            {{ $t("MESSENGER.EDIT") }}
          </VcButton>
          <VcButton
            v-if="canManageMessage"
            small
            icon="material-delete"
            class="message-item__delete-button"
            @click="handleDelete"
          >
            {{ $t("MESSENGER.DELETE_MESSAGE") }}
          </VcButton>
        </div>
        <VcButton
          v-if="message.answersCount && message.answersCount > 0"
          small
          :icon="isRepliesExpanded ? 'material-keyboard_arrow_up' : 'material-keyboard_arrow_down'"
          class="message-item__toggle-replies"
          @click="toggleReplies"
        >
          {{
            isRepliesExpanded
              ? $t("MESSENGER.HIDE_REPLIES")
              : $t("MESSENGER.SHOW_REPLIES", { count: message.answersCount })
          }}
        </VcButton>
      </div>
      <NewMessageForm
        v-if="isFormVisible"
        :loading="loading"
        :reply-to="isReplyFormVisible ? message.id : undefined"
        :is-edit="isEditFormVisible"
        :is-expanded="isFormVisible"
        :message="message"
        class="message-item__form"
        @send="sendReplyMessage"
        @update-message="updateMessage"
        @collapse="hideForm"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, onMounted, Ref, nextTick, watch, onUnmounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import NewMessageForm from "./new-message-form.vue";
import { usePopup, VcButton } from "@vc-shell/framework";
import { CommunicationUser, Message, MessageAttachment } from "@vcmp-communication/api/marketplacecommunication";
import { useElementVisibility } from "@vueuse/core";
import { formatDate, dateAgo } from "../utils";
import { ImagePreviewPopup, AssetItem } from "./";

export interface Props {
  message: Message;
  isTarget: boolean;
  loading: boolean;
  isRepliesOpen: boolean;
}

export interface Emits {
  (e: "mounted"): void;
  (
    e: "send-reply-message",
    args: { content: string; replyTo: string | undefined; entityId: string; entityType: string },
  ): void;
  (e: "update-message", args: { content: string; messageId: string; attachments: MessageAttachment[] }): void;
  (e: "remove-message", args: { messageIds: string[]; withReplies: boolean }): void;
  (e: "toggle-replies", value: boolean): void;
  (e: "mark-read", args: { messageId: string; recipientId: string }): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

const { t } = useI18n();

const MAX_ASSETS_COUNT = 5;

const decodeFileUrl = (url: string | undefined) => {
  if (!url) return "";
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

const activeAsset = ref<MessageAttachment | null>(null);

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

const { showConfirmation } = usePopup();
const currentSeller = inject("currentSeller") as Ref<{ id: string }>;

const activeForm = inject("activeForm") as Ref<{ type: "main" | "reply" | "edit" | null; id: string | null }>;
const setActiveForm = inject("setActiveForm") as (
  formType: "main" | "reply" | "edit" | null,
  formId: string | null,
) => void;

const seller = inject("seller", ref()) as Ref<CommunicationUser | undefined>;

const isFormVisible = computed(
  () =>
    (activeForm.value.type === "reply" || activeForm.value.type === "edit") && activeForm.value.id === props.message.id,
);
const isReplyFormVisible = computed(
  () => activeForm.value.type === "reply" && activeForm.value.id === props.message.id,
);
const isEditFormVisible = computed(() => activeForm.value.type === "edit" && activeForm.value.id === props.message.id);

const visibleAssets = computed(() => {
  if (isAssetsExpanded.value || (props.message.attachments?.length ?? 0) <= MAX_ASSETS_COUNT) {
    return props.message.attachments;
  }
  return props.message.attachments?.slice(0, MAX_ASSETS_COUNT);
});

const sendReplyMessage = (args: {
  content: string;
  replyTo: string | undefined;
  entityId: string;
  entityType: string;
}) => {
  emit("send-reply-message", args);
};

const updateMessage = (args: { content: string; messageId: string; attachments: MessageAttachment[] }) => {
  emit("update-message", args);
};

const showReplyForm = () => {
  setActiveForm("reply", props.message.id!);
};

const showEditForm = () => {
  setActiveForm("edit", props.message.id!);
};

const hideForm = () => {
  setActiveForm(null, null);
};

const handleDelete = async () => {
  if (await showConfirmation(computed(() => t("MESSENGER.DELETE_CONFIRMATION")))) {
    emit("remove-message", {
      messageIds: [props.message.id!],
      withReplies: true,
    });
  }
};

const messageItemRef = ref<HTMLElement | null>(null);

const isHighlighted = ref(false);

const isExpanded = ref(false);
const contentRef = ref<HTMLElement | null>(null);
const isContentTruncated = ref(false);
const isAssetsExpanded = ref(false);

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
};

let resizeObserver: ResizeObserver | null = null;

const checkContentTruncation = () => {
  if (contentRef.value) {
    const element = contentRef.value;
    const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
    const maxHeight = lineHeight * 4;

    const currentHeight = element.scrollHeight;
    isContentTruncated.value = currentHeight > maxHeight;
  }
};

const openImagePreview = (asset: MessageAttachment) => {
  activeAsset.value = asset;
  openPopup();
};

onMounted(() => {
  nextTick(() => {
    if (contentRef.value) {
      resizeObserver = new ResizeObserver(() => {
        checkContentTruncation();
      });
      resizeObserver.observe(contentRef.value);
    }
    checkContentTruncation();
  });

  if (props.isTarget) {
    isHighlighted.value = true;
    setTimeout(() => {
      isHighlighted.value = false;
    }, 3000);
  }
});

watch(
  () => props.message.content,
  () => {
    nextTick(checkContentTruncation);
  },
);

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const hasHiddenAssets = computed(() => {
  return (props.message.attachments?.length ?? 0) > MAX_ASSETS_COUNT;
});

const toggleAssetsList = () => {
  isAssetsExpanded.value = !isAssetsExpanded.value;
};

const canManageMessage = computed(() => {
  return currentSeller.value.id === props.message?.sender?.userId && props.message?.answersCount === 0;
});

const isRepliesExpanded = ref(props.isRepliesOpen);

const toggleReplies = () => {
  isRepliesExpanded.value = !isRepliesExpanded.value;
  emit("toggle-replies", isRepliesExpanded.value);
};

watch(
  () => props.message.answersCount,
  () => {
    isRepliesExpanded.value = true;
  },
);

const isUnread = computed(() => {
  if (!props.message.recipients || props.message.senderId === seller.value?.id) {
    return false;
  }

  const recipient = props.message.recipients.find((recipient) => recipient.recipientId === seller.value?.id);

  return recipient && recipient.readStatus === "New";
});

const isProgrammaticScroll = inject("isProgrammaticScroll", ref(false));

const markAsRead = (message: Message) => {
  if (!isUnread.value) {
    return;
  }

  const recipient = message.recipients?.find(
    (recipient) => recipient.recipientId === seller.value?.id && recipient.readStatus === "New",
  );

  if (!recipient || message.senderId === seller.value?.id) {
    return;
  }

  emit("mark-read", {
    messageId: message.id!,
    recipientId: seller.value?.id ?? "",
  });
};

let timer: number | null = null;

const delayedMarkRead = () => {
  if (isProgrammaticScroll.value) return;

  timer = setTimeout(() => {
    if (props.message.id) {
      markAsRead(props.message);
    }
  }, 2000);
};

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer);
  }
});

const isVisible = useElementVisibility(messageItemRef);

watch(
  [isVisible, isUnread],
  ([newValue, unread]) => {
    if (newValue && unread) {
      delayedMarkRead();
    }
  },
  { immediate: true },
);
</script>

<style lang="scss">
:root {
  --message-item-avatar-size: 48px;
  --message-item-author-color: var(--neutrals-400);
  --message-item-date-color: var(--neutrals-500);
}

.message-item {
  &--target {
    @apply tw-border tw-border-solid tw-rounded-[var(--blade-border-radius)] tw-border-[color:var(--primary-500)];
  }

  &--highlight {
    animation: highlight 1s ease-in-out 3;
  }

  &__main {
    @apply tw-p-3 tw-bg-[color:var(--blade-background-color)] tw-rounded-[var(--blade-border-radius)];
    @apply tw-border tw-border-solid tw-border-[color:var(--blade-border-color)];
    @apply tw-shadow-sm;
  }

  &__header {
    @apply tw-flex tw-justify-between tw-items-center tw-mb-2;
  }

  &__author-info {
    @apply tw-flex tw-items-center;
  }

  &__avatar {
    @apply tw-mr-2 tw-text-[length:var(--message-item-avatar-size)] tw-text-[color:var(--message-item-author-color)];
  }

  &__author {
    @apply tw-font-semibold tw-text-sm tw-text-[color:var(--base-text-color)];
  }

  &__author-info-wrapper {
    @apply tw-flex tw-flex-col tw-gap-1;
  }

  &__date {
    @apply tw-text-[color:var(--message-item-date-color)] tw-text-xs;
  }

  &__content-wrapper {
    @apply tw-mb-2 tw-relative;
  }

  &__content {
    @apply tw-overflow-hidden tw-leading-normal;

    &--collapsed {
      @apply tw-max-h-24;
    }
  }

  &__content-overlay {
    @apply tw-relative tw-mt-1;
    @apply tw-flex;

    &--expanded {
      @apply tw-mt-0;
    }
  }

  &__gradient {
    @apply tw-absolute tw-left-0 tw-right-0 tw-bottom-full tw-h-8;
    background: linear-gradient(to bottom, rgb(from var(--neutrals-800) r g b / 0%), var(--additional-50));
  }

  &__actions {
    @apply tw-flex tw-gap-2;
  }

  &__reply-button,
  &__edit-button,
  &__delete-button {
    @apply tw-mt-2 tw-text-xs tw-text-[color:var(--primary-color)];
  }

  &__form {
    @apply tw-mt-2;
  }

  &__expand-button {
    @apply tw-text-xs tw-text-[color:var(--primary-color)] tw-mt-1;
    @apply tw-bg-[color:var(--neutrals-50)];
    @apply tw-px-2 tw-py-1;
    @apply tw-rounded;
  }

  &--mobile {
    .message-item__main {
      @apply tw-p-2;
    }

    .message-item__header {
      @apply tw-mb-1;
    }

    .message-item__author {
      @apply tw-text-xs;
    }

    .message-item__date {
      @apply tw-text-[10px];
    }

    .message-item__content {
      @apply tw-text-sm;
    }

    .message-item__actions {
      @apply tw-flex-wrap;
    }

    .message-item__reply-button,
    .message-item__edit-button,
    .message-item__delete-button {
      @apply tw-mt-1;
    }
  }

  &__footer {
    @apply tw-flex tw-justify-between tw-items-end;
  }

  &__toggle-replies {
    @apply tw-text-xs tw-text-[color:var(--primary-color)] tw-mt-1;
  }

  &__author-row {
    @apply tw-flex tw-items-center tw-gap-2;
  }

  &__unread-indicator {
    @apply tw-w-2 tw-h-2 tw-rounded-full tw-bg-[color:var(--danger-500)];
  }

  &__assets {
    @apply tw-mt-2;
  }

  &__assets-list {
    @apply tw-flex tw-flex-wrap tw-gap-3;
  }

  &__asset {
    @apply tw-rounded-lg tw-overflow-hidden;
    @apply tw-transition-all;
    @apply tw-no-underline;
  }
}

@keyframes highlight {
  0% {
    @apply tw-border-[color:var(--primary-500)];
  }
  50% {
    @apply tw-border-transparent;
  }
  100% {
    @apply tw-border-[color:var(--primary-500)];
  }
}
</style>
