<template>
  <div
    v-loading="loading"
    class="new-message-form"
  >
    <VcInput
      v-if="!isExpanded && !message?.content"
      type="text"
      :placeholder="$t('MESSENGER.ADD_PLACEHOLDER')"
      class="new-message-form__input"
      @focus="expandForm"
    />
    <form
      v-else
      class="new-message-form__expanded"
      @submit.prevent="send"
    >
      <div class="new-message-form__content-wrapper">
        <VcTextarea
          ref="textareaRef"
          v-model="content"
          :placeholder="$t('MESSENGER.ENTER_MESSAGE')"
          class="new-message-form__content"
          maxlength="10000"
        />
        <div
          class="new-message-form__assets-zone"
          :class="{ 'new-message-form__assets-zone--dragging': isDragging }"
          @dragenter.prevent="handleDragEnter"
          @dragleave.prevent="handleDragLeave"
          @dragover.prevent
          @drop.prevent="handleDrop"
        >
          <div
            v-if="uploadError"
            class="new-message-form__upload-error"
          >
            <i class="material-error new-message-form__upload-error-icon" />
            <span class="new-message-form__upload-error-text">
              {{ uploadError }}
            </span>
          </div>
          <div class="new-message-form__assets-wrapper">
            <input
              ref="fileInputRef"
              type="file"
              multiple
              :accept="allowedFileTypes"
              class="tw-hidden"
              @change="handleFileSelect"
            />
            <VcButton
              type="button"
              text
              :title="$t('MESSENGER.ATTACH_FILES')"
              icon-size="m"
              icon-class="new-message-form__attach-button-icon"
              :icon="isUploading ? 'material-sync' : 'material-attach_file'"
              class="new-message-form__attach-button"
              :disabled="isUploading"
              @click="openFileSelect"
            />

            <div
              v-if="assets.length || isUploading || uploadError"
              class="new-message-form__assets"
            >
              <div class="new-message-form__assets-list">
                <AssetItem
                  v-for="asset in assets"
                  :key="asset.id"
                  :asset="asset"
                  :show-size="true"
                  class="new-message-form__asset"
                >
                  <template #actions>
                    <VcButton
                      type="button"
                      text
                      icon="material-close"
                      icon-size="l"
                      class="new-message-form__asset-remove"
                      :disabled="isUploading"
                      @click="() => removeAsset(asset)"
                    />
                  </template>
                </AssetItem>
                <div
                  v-if="isUploading"
                  class="new-message-form__asset-item new-message-form__asset-item--loading"
                >
                  <VcIcon icon="material-sync" />
                  <span class="new-message-form__asset-name">
                    {{ $t("MESSENGER.UPLOADING_FILES") }}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            v-if="isDragging"
            class="new-message-form__drop-overlay"
          >
            <span class="new-message-form__drop-text">
              {{ $t("MESSENGER.DROP_FILES") }}
            </span>
          </div>
        </div>
      </div>
      <div class="new-message-form__actions">
        <VcButton
          type="button"
          small
          icon="material-close"
          class="new-message-form__cancel"
          @click="cancel"
        >
          {{ $t("MESSENGER.CANCEL") }}
        </VcButton>
        <VcButton
          type="submit"
          icon="material-send"
          :disabled="!content.trim() || !isModified || assetsLoading"
          small
          class="new-message-form__submit"
          @click="send"
        >
          {{ submitButtonText }}
        </VcButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, nextTick, Ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  Conversation,
  MarketplaceCommunicationSettings,
  Message,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";
import { loading as vLoading, VcTextarea, VcButton, useAssets, usePopup } from "@vc-shell/framework";
import { useMagicKeys } from "@vueuse/core";
import { AssetItem } from "./";
import { getAllowedFileTypes } from "../constants";
import * as _ from "lodash-es";

const props = defineProps<{
  replyTo?: string;
  isExpanded: boolean;
  isEdit?: boolean;
  message?: Message;
  loading: boolean;
}>();

const emit = defineEmits<{
  (
    e: "send",
    args: {
      content: string;
      replyTo: string | undefined;
      entityId: string;
      entityType: string;
      attachments: MessageAttachment[];
    },
  ): void;
  (e: "collapse"): void;
  (e: "expand"): void;
  (
    e: "update-message",
    args: {
      content: string;
      messageId: string;
      attachments: MessageAttachment[];
    },
  ): void;
}>();

const { t } = useI18n();
const keys = useMagicKeys();

const { edit, upload, remove, loading: assetsLoading } = useAssets();
const { showError } = usePopup();

const entityId = inject("entityId") as string;
const entityType = inject("entityType") as string;
const conversation = inject("conversation") as Conversation;
const settings = inject("settings") as Ref<MarketplaceCommunicationSettings>;
const assets = ref<MessageAttachment[]>(props.replyTo ? [] : props.message?.attachments || []);

const content = ref(props.isEdit ? props.message?.content || "" : "");
const textareaRef = ref<InstanceType<typeof VcTextarea>>();
const fileInputRef = ref<HTMLInputElement>();
const isDragging = ref(false);
const isUploading = ref(false);
const uploadError = ref<string | null>(null);

const allowedFileTypes = getAllowedFileTypes();
let dragCounter = 0;

// Magic keys
const enter = keys["Enter"];

watch(enter, (v) => {
  if (v) {
    send();
  }
});

const isAssetsModified = computed(() => {
  if (!props.message?.attachments) return assets.value.length > 0;

  if (assets.value.length !== props.message.attachments.length) return true;

  return assets.value.some((asset) => !props.message?.attachments?.find((a) => a.id === asset.id));
});

const isModified = computed(() => {
  if (!props.isEdit) return true;

  const isContentModified = content.value.trim() !== props.message?.content?.trim();
  return isContentModified || isAssetsModified.value;
});

const submitButtonText = computed(() => {
  return props.isEdit ? t("MESSENGER.SAVE_CHANGES") : t("MESSENGER.ADD_COMMENT");
});

const expandForm = () => {
  emit("expand");
};

const send = () => {
  if (props.isEdit && props.message?.id) {
    if (content.value.trim()) {
      emit("update-message", {
        content: content.value,
        messageId: props.message.id,
        attachments: assets.value,
      });
      emit("collapse");
    }
  } else {
    if (content.value.trim()) {
      emit("send", {
        content: content.value,
        replyTo: props.replyTo,
        entityId: entityId,
        entityType: entityType,
        attachments: assets.value,
      });
      if (!props.message?.content) {
        content.value = "";

        emit("collapse");
      }
    }
  }
  assets.value = [];
};

const cancel = () => {
  content.value = "";
  emit("collapse");
};

watch(
  () => props.isExpanded,
  (newValue) => {
    if (!newValue && !props.message?.content) {
      content.value = "";
    }

    if (newValue) {
      nextTick(() => {
        textareaRef.value?.focus();
      });
    }
  },
  {
    immediate: true,
  },
);

const assetsHandler = {
  loading: computed(() => assetsLoading.value),
  edit: (files: MessageAttachment[]) => {
    assets.value = edit(files, assets.value).map((x) => new MessageAttachment(x));

    return assets.value;
  },
  async upload(files: FileList | null) {
    if (files) {
      const path = entityType && entityId ? `messenger/${entityType}/${entityId}` : `messenger/${conversation?.id}`;
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
:root {
  --new-message-form-background-color: var(--blade-background-color, var(--additional-50));
  --new-message-form-attach-button-icon-color: var(--neutrals-500);
}

.new-message-form {
  @apply tw-w-full tw-bg-[--new-message-form-background-color];

  &__expanded {
    @apply tw-flex tw-flex-col tw-gap-0;
  }

  &__content-wrapper {
    @apply tw-border tw-border-[color:var(--neutrals-200)] tw-rounded-md tw-overflow-hidden;
  }

  &__content {
    @apply tw-w-full tw-min-h-[85px] tw-resize-y;
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-border-0;

    .vc-textarea__field {
      @apply tw-min-h-[85px] tw-border-0;
    }
  }

  &__assets-wrapper {
    @apply tw-flex tw-items-start tw-gap-2 tw-px-2 tw-py-1;
  }

  &__attach-button {
    @apply tw-w-8 tw-h-8 tw-min-w-0;
    @apply tw-p-0;
    @apply tw-shrink-0;

    &:hover {
      @apply tw-bg-[color:var(--neutrals-100)];
    }
  }

  &__attach-button-icon {
    @apply tw-text-[color:var(--new-message-form-attach-button-icon-color)];
  }

  &__submit {
    @apply tw-self-end;
  }

  &__actions {
    @apply tw-flex tw-items-center tw-gap-2 tw-mt-2;
  }

  &__asset-icon {
    @apply tw-text-[color:var(--neutrals-500)];
    @apply tw-text-lg;
  }

  &__assets-list {
    @apply tw-flex tw-flex-row tw-gap-2 tw-flex-wrap;
  }

  &__asset-item {
    @apply tw-flex tw-items-center tw-gap-3;
    @apply tw-bg-[color:var(--neutrals-50)];
    @apply tw-border tw-border-[color:var(--neutrals-200)];
    @apply tw-rounded-lg;
    @apply tw-p-2;
  }

  &__asset-icon-wrapper {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-10 tw-h-10;
    @apply tw-rounded;
    @apply tw-bg-[color:var(--primary-50)];
  }

  &__asset-icon {
    @apply tw-text-[color:var(--primary-500)];
    @apply tw-text-lg;
  }

  &__asset-info {
    @apply tw-flex tw-flex-col tw-flex-grow;
  }

  &__asset-name {
    @apply tw-max-w-full tw-truncate;
    @apply tw-text-sm tw-font-medium;
    @apply tw-text-[color:var(--neutrals-950)] tw-ml-1;
  }

  &__asset-size {
    @apply tw-text-xs tw-text-[color:var(--neutrals-500)];
  }

  &__asset-remove {
    @apply tw-self-start;
    @apply tw-opacity-60 hover:tw-opacity-100;
  }

  &__assets-toggle {
    @apply tw-mt-1 tw-text-xs tw-text-[color:var(--primary-500)];
    @apply hover:tw-text-[color:var(--primary-600)];
  }

  &__assets-zone {
    @apply tw-relative;
  }

  &__drop-overlay {
    @apply tw-absolute tw-inset-0 tw-z-10;
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-bg-white/60 tw-backdrop-blur-sm;
    @apply tw-border-2 tw-border-dashed tw-border-[color:var(--neutrals-400)];
  }

  &__drop-text {
    @apply tw-text-[color:var(--neutrals-900)] tw-font-medium;
  }

  &__assets-zone--dragging {
    @apply tw-relative;
  }

  &__upload-error {
    @apply tw-flex tw-items-center tw-gap-2;
    @apply tw-bg-[color:var(--danger-50)];
    @apply tw-border-b tw-border-[color:var(--danger-100)];
    @apply tw-px-3 tw-py-2;
    @apply tw-text-sm;
  }

  &__upload-error-icon {
    @apply tw-text-[color:var(--danger-500)];
  }

  &__upload-error-text {
    @apply tw-text-[color:var(--danger-500)];
  }
}
</style>
