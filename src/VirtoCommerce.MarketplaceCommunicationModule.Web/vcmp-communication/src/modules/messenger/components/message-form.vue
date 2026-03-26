<template>
  <div
    v-loading="loading"
    class="message-form"
  >
    <!-- Collapsed state: clickable placeholder (only for "new" mode) -->
    <div
      v-if="mode === 'new' && !isExpanded"
      class="message-form__collapsed"
      @click="expandForm"
    >
      <VcIcon
        icon="lucide-message-square-plus"
        size="s"
        class="message-form__collapsed-icon"
      />
      <span class="message-form__collapsed-text">
        {{ placeholder ?? $t("MESSENGER.ADD_PLACEHOLDER") }}
      </span>
    </div>

    <!-- Expanded form: unified container -->
    <div
      v-else
      class="message-form__container"
      :class="{
        'message-form__container--focused': isFocused,
        'message-form__container--dragging': isDragging,
      }"
      @dragenter.prevent="handleDragEnter"
      @dragleave.prevent="handleDragLeave"
      @dragover.prevent
      @drop.prevent="handleDrop"
    >
      <!-- Drop overlay -->
      <div
        v-if="isDragging"
        class="message-form__drop-overlay"
      >
        <VcIcon icon="lucide-upload" size="l" class="message-form__drop-icon" />
        <span class="message-form__drop-text">{{ $t("MESSENGER.DROP_FILES") }}</span>
      </div>

      <!-- Upload error banner -->
      <div
        v-if="uploadError"
        class="message-form__error"
      >
        <VcIcon icon="lucide-alert-circle" size="s" class="message-form__error-icon" />
        <span class="message-form__error-text">{{ uploadError }}</span>
        <button class="message-form__error-close" @click="uploadError = null">
          <VcIcon icon="lucide-x" size="xs" />
        </button>
      </div>

      <!-- Reply preview -->
      <div v-if="replyTo" class="message-form__reply-preview">
        <div class="message-form__reply-preview-content">
          <span class="message-form__reply-preview-author">{{ replyTo.sender?.userName }}</span>
          <span class="message-form__reply-preview-text">{{ replyTo.content }}</span>
        </div>
        <button class="message-form__reply-preview-close" @click="$emit('cancel')">
          <VcIcon icon="lucide-x" size="xs" />
        </button>
      </div>

      <!-- Textarea -->
      <VcTextarea
        ref="textareaRef"
        v-model="content"
        :placeholder="placeholder ?? $t('MESSENGER.ENTER_MESSAGE')"
        class="message-form__textarea"
        maxlength="10000"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />

      <!-- Attached files grid -->
      <div
        v-if="assets.length || isUploading"
        class="message-form__attachments"
      >
        <div class="message-form__attachments-grid">
          <AttachmentPreview
            v-for="asset in assets"
            :key="asset.id"
            :asset="asset"
            @remove="removeAsset(asset)"
          />
          <AttachmentPreview
            v-if="isUploading"
            :asset="({} as any)"
            uploading
          />
        </div>
      </div>

      <!-- Toolbar row: paperclip left, actions right -->
      <div class="message-form__toolbar">
        <!-- Hidden file input -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          :accept="allowedFileTypes"
          style="display: none !important; position: absolute; width: 0; height: 0; overflow: hidden;"
          @change="handleFileSelect"
        />
        <div class="message-form__toolbar-left">
          <button
            type="button"
            class="message-form__tool-btn"
            :title="$t('MESSENGER.ATTACH_FILES')"
            :disabled="isUploading"
            @click="openFileSelect"
          >
            <VcIcon
              :icon="isUploading ? 'lucide-loader-2' : 'lucide-paperclip'"
              size="s"
              :class="{ 'message-form__uploading-spinner': isUploading }"
            />
          </button>
        </div>
        <div class="message-form__toolbar-right">
          <button
            v-if="mode === 'new' || mode === 'edit'"
            type="button"
            class="message-form__tool-btn message-form__tool-btn--cancel"
            @click="cancel"
          >
            {{ mode === "edit" ? $t("MESSENGER.CANCEL") : $t("MESSENGER.CANCEL") }}
          </button>
          <button
            type="button"
            class="message-form__send-btn"
            :class="{ 'message-form__send-btn--active': canSend }"
            :disabled="!canSend"
            @click="send"
          >
            <VcIcon icon="lucide-send" size="xs" />
            <span>{{ submitButtonText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Keyboard hints -->
    <div
      v-if="isExpanded || mode === 'reply' || mode === 'edit'"
      class="message-form__hint"
    >
      <span class="message-form__hint-item">
        <kbd class="message-form__kbd">Enter</kbd>
        {{ $t("MESSENGER.NEW_LINE_HINT") }}
      </span>
      <span class="message-form__hint-item">
        <kbd v-if="isMac" class="message-form__kbd">⌘</kbd>
        <kbd v-else class="message-form__kbd">Ctrl</kbd>
        <span class="message-form__hint-plus">+</span>
        <kbd class="message-form__kbd">Enter</kbd>
        {{ $t("MESSENGER.SEND_HINT") }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import {
  Message,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";
import { loading as vLoading, VcTextarea, useAssets, usePopup } from "@vc-shell/framework";
import { useMagicKeys } from "@vueuse/core";
import { getAllowedFileTypes } from "../constants";
import { messengerContextKey, messengerStoreKey } from "../injection-keys";
import AttachmentPreview from "./attachment-preview.vue";
import * as _ from "lodash-es";

const props = withDefaults(
  defineProps<{
    mode: "new" | "reply" | "edit";
    message?: Message;
    replyTo?: Message | null;
    placeholder?: string;
    loading?: boolean;
  }>(),
  {
    loading: false,
  },
);

const emit = defineEmits<{
  (e: "send", args: { content: string; attachments: MessageAttachment[] }): void;
  (e: "cancel"): void;
}>();

const { t } = useI18n();
const keys = useMagicKeys();

const { edit, upload, remove, loading: assetsLoading } = useAssets();
const { showError } = usePopup();

const messengerContext = inject(messengerContextKey);
const messengerStore = inject(messengerStoreKey);

const entityId = computed(() => messengerContext?.entityId);
const entityType = computed(() => messengerContext?.entityType);
const conversation = computed(() => messengerContext?.conversation.value);
const settings = computed(() => messengerStore?.settings.value);

const assets = ref<MessageAttachment[]>(
  props.mode === "edit" ? (props.message?.attachments ?? []) : [],
);

const content = ref(props.mode === "edit" ? (props.message?.content ?? "") : "");
const isExpanded = ref(props.mode !== "new");
const isFocused = ref(false);
const textareaRef = ref<InstanceType<typeof VcTextarea>>();
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const allowedFileTypes = getAllowedFileTypes();
let dragCounter = 0;

// Ctrl+Enter (Win/Linux) or Cmd+Enter (Mac) to send
const isMac = navigator.platform.toUpperCase().includes("MAC");
const sendCombo = isMac ? keys["Meta+Enter"] : keys["Control+Enter"];

watch(sendCombo, (v) => {
  if (v && isFocused.value) {
    send();
  }
});

const isAssetsModified = computed(() => {
  if (!props.message?.attachments) return assets.value.length > 0;
  if (assets.value.length !== props.message.attachments.length) return true;
  return assets.value.some((asset) => !props.message?.attachments?.find((a) => a.id === asset.id));
});

const isModified = computed(() => {
  if (props.mode !== "edit") return true;
  const isContentModified = content.value.trim() !== props.message?.content?.trim();
  return isContentModified || isAssetsModified.value;
});

const canSend = computed(() => content.value.trim().length > 0 && isModified.value && !assetsLoading.value);

const submitButtonText = computed(() => {
  return props.mode === "edit" ? t("MESSENGER.SAVE_CHANGES") : t("MESSENGER.ADD_COMMENT");
});

const expandForm = () => {
  isExpanded.value = true;
  nextTick(() => {
    textareaRef.value?.focus();
  });
};

const collapseForm = () => {
  isExpanded.value = false;
  content.value = "";
  assets.value = [];
};

const send = () => {
  if (!canSend.value) return;

  emit("send", {
    content: content.value,
    attachments: assets.value,
  });

  assets.value = [];

  if (props.mode === "new") {
    collapseForm();
  } else if (props.mode === "reply") {
    content.value = "";
  }
};

const cancel = () => {
  emit("cancel");

  if (props.mode === "new") {
    collapseForm();
  } else if (props.mode === "reply") {
    content.value = "";
  }
};

// Auto-expand form when replyTo is set
watch(() => props.replyTo, (newVal) => {
  if (newVal) {
    isExpanded.value = true;
  }
});

// Auto-focus for reply/edit modes
watch(
  () => props.mode,
  () => {
    if (props.mode === "reply" || props.mode === "edit") {
      nextTick(() => {
        textareaRef.value?.focus();
      });
    }
  },
  { immediate: true },
);

// Asset handling
const assetsHandler = {
  loading: computed(() => assetsLoading.value),
  edit: (files: MessageAttachment[]) => {
    assets.value = edit(files, assets.value).map((x) => new MessageAttachment(x));
    return assets.value;
  },
  async upload(files: FileList | null) {
    if (files) {
      const eType = entityType.value;
      const eId = entityId.value;
      const path = eType && eId ? `messenger/${eType}/${eId}` : `messenger/${conversation.value?.id}`;
      const uploaded = (await upload(files, path)).map(
        (x) =>
          new MessageAttachment({
            ...x,
            attachmentUrl: x.url,
            fileName: x.name,
            fileType: x.name?.toLowerCase().split(".").pop(),
            fileSize: x.size,
          }),
      );

      if (!assets.value) {
        assets.value = [];
      }

      assets.value = assets.value.concat(uploaded);
      files = null;
      return assets.value;
    }
  },
  async remove(files: MessageAttachment[]) {
    try {
      if (assets.value && assets.value.length && files.length > 0) {
        assets.value = _.differenceWith(assets.value, files, (x, y) => {
          if ("url" in x && "url" in y) {
            return x.url === y.url;
          }
          return x.attachmentUrl === y.attachmentUrl;
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  },
};

const removeAsset = async (asset: MessageAttachment) => {
  await assetsHandler.remove([asset]);
};

const handleDragEnter = (e: DragEvent) => {
  dragCounter++;
  if (e.dataTransfer?.types.includes("Files")) {
    isDragging.value = true;
  }
};

const handleDragLeave = () => {
  dragCounter--;
  if (dragCounter === 0) {
    isDragging.value = false;
  }
};

const validateFiles = (files: File[]): { validFiles: File[]; errors: string[] } => {
  const errors: string[] = [];
  let validFiles = [...files];

  const invalidTypeFiles = validFiles.filter((file) => {
    const extension = file.name.toLowerCase().split(".").pop() || "";
    return !allowedFileTypes.includes(`.${extension}`);
  });

  if (invalidTypeFiles.length) {
    errors.push(t("MESSENGER.ERROR_FILE_TYPE", { fileName: invalidTypeFiles[0].name }));
    validFiles = validFiles.filter((file) => !invalidTypeFiles.includes(file));
  }

  const duplicates = validFiles.filter((file) => validateDuplicateFile(file.name));
  if (duplicates.length) {
    errors.push(t("MESSENGER.ERROR_DUPLICATE_FILE", { fileName: duplicates[0].name }));
    validFiles = validFiles.filter((file) => !duplicates.includes(file));
  }

  const maxFiles = settings.value?.attachmentCountLimit ?? 0;
  const totalFiles = assets.value.length + validFiles.length;
  if (totalFiles > maxFiles) {
    errors.push(t("MESSENGER.ERROR_FILE_COUNT_LIMIT", { limit: maxFiles }));
    validFiles = validFiles.slice(0, maxFiles - assets.value.length);
  }

  const maxSizeInBytes = (settings.value?.attachmentSizeLimit ?? 0) * 1024 * 1024;
  const currentSize = assets.value.reduce((sum, asset) => sum + (asset.fileSize ?? 0), 0);
  let remainingSize = maxSizeInBytes - currentSize;

  const validatedBySize: File[] = [];
  const invalidBySize: File[] = [];

  for (const file of validFiles) {
    if (remainingSize >= file.size) {
      validatedBySize.push(file);
      remainingSize -= file.size;
    } else {
      invalidBySize.push(file);
    }
  }

  if (invalidBySize.length) {
    errors.push(t("MESSENGER.ERROR_FILE_SIZE_LIMIT", { limit: settings.value?.attachmentSizeLimit }));
  }

  return {
    validFiles: validatedBySize,
    errors,
  };
};

const validateDuplicateFile = (fileName: string): boolean => {
  return assets.value.some((asset) => asset.fileName === fileName);
};

const processFiles = async (files: File[]) => {
  const { validFiles, errors } = validateFiles(files);

  const limitErrors = errors.filter((error) => error.includes("Maximum number") || error.includes("Total files size"));
  if (limitErrors.length) {
    showError(limitErrors.join("\n"));
  }

  const inlineErrors = errors.filter(
    (error) => error.includes("already attached") || error.includes("is not supported"),
  );
  if (inlineErrors.length) {
    uploadError.value = inlineErrors.join("\n");
  } else {
    uploadError.value = null;
  }

  if (validFiles.length) {
    try {
      isUploading.value = true;
      const dataTransfer = new DataTransfer();
      validFiles.forEach((file) => dataTransfer.items.add(file));
      await assetsHandler.upload(dataTransfer.files);
    } finally {
      isUploading.value = false;
    }
  }
};

const handleFileSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files?.length) {
    await processFiles(Array.from(input.files));
    input.value = "";
  }
};

const handleDrop = async (e: DragEvent) => {
  dragCounter = 0;
  isDragging.value = false;

  const files = e.dataTransfer?.files;
  if (files?.length) {
    await processFiles(Array.from(files));
  }
};

watch(assets, () => {
  uploadError.value = null;
});

const openFileSelect = () => {
  fileInputRef.value?.click();
};
</script>

<style lang="scss">
.message-form {
  @apply tw-w-full;

  // --- Collapsed placeholder ---
  &__collapsed {
    @apply tw-flex tw-items-center tw-gap-2;
    @apply tw-px-3 tw-py-2.5;
    @apply tw-rounded-lg tw-cursor-pointer;
    @apply tw-border tw-border-solid tw-border-[color:var(--neutrals-200)];
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-transition-all;

    &:hover {
      @apply tw-border-[color:var(--neutrals-300)];
      @apply tw-shadow-sm;
    }
  }

  &__collapsed-icon {
    @apply tw-text-[color:var(--neutrals-400)] tw-flex-shrink-0;
  }

  &__collapsed-text {
    @apply tw-text-sm tw-text-[color:var(--neutrals-400)];
    @apply tw-select-none;
  }

  // --- Expanded container ---
  &__container {
    @apply tw-relative;
    @apply tw-rounded-lg tw-overflow-hidden;
    @apply tw-border tw-border-solid tw-border-[color:var(--neutrals-200)];
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-transition-all;

    &--focused {
      @apply tw-border-[color:var(--primary-300)];
      box-shadow: 0 0 0 1px var(--primary-100);
    }

    &--dragging {
      @apply tw-border-[color:var(--primary-400)];
      @apply tw-border-dashed;
    }
  }

  // --- Reply preview ---
  &__reply-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background-color: var(--neutrals-50);
    border-left: 3px solid var(--primary-400);
    border-bottom: 1px solid var(--neutrals-200);
  }

  &__reply-preview-content {
    flex: 1;
    min-width: 0;
    overflow: hidden;
  }

  &__reply-preview-author {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--primary-600);
  }

  &__reply-preview-text {
    display: block;
    font-size: 12px;
    color: var(--neutrals-600);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__reply-preview-close {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--neutrals-400);
    padding: 4px;

    &:hover {
      color: var(--neutrals-600);
    }
  }

  // --- Textarea ---
  &__textarea {
    @apply tw-w-full;

    .vc-textarea__field {
      @apply tw-min-h-[56px] tw-max-h-[200px];
      @apply tw-border-0 tw-shadow-none tw-outline-none;
      @apply tw-text-sm tw-leading-relaxed;
      @apply tw-px-3 tw-py-2.5;
      @apply tw-bg-transparent;
      @apply tw-resize-none;

      &:focus {
        @apply tw-outline-none tw-shadow-none tw-border-0;
      }
    }
  }

  // --- Attachments grid ---
  &__attachments {
    @apply tw-px-3 tw-py-2;
  }

  &__attachments-grid {
    @apply tw-flex tw-flex-wrap tw-gap-2;
  }

  // --- Toolbar ---
  &__toolbar {
    @apply tw-flex tw-items-center tw-justify-between;
    @apply tw-px-2 tw-py-1.5;
    @apply tw-border-t tw-border-solid tw-border-[color:var(--neutrals-100)];
  }

  &__toolbar-left,
  &__toolbar-right {
    @apply tw-flex tw-items-center tw-gap-1;
  }

  &__tool-btn {
    @apply tw-flex tw-items-center tw-justify-center tw-gap-1;
    @apply tw-h-7 tw-min-w-[28px] tw-px-1.5;
    @apply tw-rounded;
    @apply tw-border-0 tw-bg-transparent tw-cursor-pointer;
    @apply tw-text-[color:var(--neutrals-500)];
    @apply tw-text-xs;
    @apply tw-transition-colors;

    &:hover:not(:disabled) {
      @apply tw-bg-[color:var(--neutrals-100)];
      @apply tw-text-[color:var(--neutrals-700)];
    }

    &:disabled {
      @apply tw-opacity-40 tw-cursor-not-allowed;
    }

    &--cancel {
      @apply tw-px-2;
    }
  }

  &__send-btn {
    @apply tw-inline-flex tw-items-center tw-gap-1;
    @apply tw-h-7 tw-px-2.5;
    @apply tw-rounded;
    @apply tw-border-0 tw-cursor-pointer;
    @apply tw-text-xs tw-font-medium;
    @apply tw-bg-[color:var(--neutrals-100)];
    @apply tw-text-[color:var(--neutrals-400)];
    @apply tw-transition-all;

    &--active {
      @apply tw-bg-[color:var(--primary-500)];
      @apply tw-text-white;

      &:hover {
        @apply tw-bg-[color:var(--primary-600)];
      }
    }

    &:disabled {
      @apply tw-cursor-not-allowed;
    }
  }

  // --- Drop overlay ---
  &__drop-overlay {
    @apply tw-absolute tw-inset-0 tw-z-10;
    @apply tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-2;
    @apply tw-bg-[color:var(--primary-50)];
    opacity: 0.95;
  }

  &__drop-icon {
    @apply tw-text-[color:var(--primary-400)];
  }

  &__drop-text {
    @apply tw-text-[color:var(--primary-600)] tw-font-medium tw-text-sm;
  }

  // --- Error banner ---
  &__error {
    @apply tw-flex tw-items-center tw-gap-2;
    @apply tw-px-3 tw-py-1.5;
    @apply tw-bg-[color:var(--danger-50)];
    @apply tw-border-b tw-border-solid tw-border-[color:var(--danger-100)];
    @apply tw-text-xs;
  }

  &__error-icon {
    @apply tw-text-[color:var(--danger-500)] tw-flex-shrink-0;
  }

  &__error-text {
    @apply tw-flex-1 tw-text-[color:var(--danger-600)];
  }

  &__error-close {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-4 tw-h-4;
    @apply tw-border-0 tw-bg-transparent tw-cursor-pointer;
    @apply tw-text-[color:var(--danger-400)];
    @apply tw-rounded-sm;

    &:hover {
      @apply tw-text-[color:var(--danger-600)];
      @apply tw-bg-[color:var(--danger-100)];
    }
  }

  // --- Uploading spinner ---
  &__uploading-spinner {
    animation: message-form-spin 1s linear infinite;
  }

  // --- Keyboard hint ---
  &__hint {
    @apply tw-flex tw-items-center tw-justify-end tw-gap-3;
    @apply tw-pt-1.5 tw-px-1;
    @apply tw-select-none;
  }

  &__hint-item {
    @apply tw-flex tw-items-center tw-gap-1;
    @apply tw-text-[11px];
    @apply tw-text-[color:var(--neutrals-400)];
    @apply tw-leading-none;
  }

  &__hint-plus {
    @apply tw-text-[color:var(--neutrals-300)];
  }

  &__kbd {
    @apply tw-inline-flex tw-items-center tw-justify-center;
    @apply tw-min-w-[20px] tw-h-[18px] tw-px-1;
    @apply tw-rounded-sm;
    @apply tw-text-[10px] tw-font-medium;
    @apply tw-text-[color:var(--neutrals-500)];
    @apply tw-bg-[color:var(--neutrals-100)];
    @apply tw-border tw-border-solid tw-border-[color:var(--neutrals-200)];
    @apply tw-leading-none;
    box-shadow: 0 1px 0 var(--neutrals-200);
  }
}

@keyframes message-form-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
