<template>
  <div
    class="attachment-preview"
    :class="{
      'attachment-preview--uploading': uploading,
    }"
  >
    <!-- Uploading state -->
    <template v-if="uploading">
      <VcIcon icon="lucide-loader-2" size="s" class="attachment-preview__spinner" />
      <span class="attachment-preview__upload-label">{{ $t("MESSENGER.UPLOADING_FILES") }}</span>
    </template>

    <!-- Image thumbnail -->
    <template v-else-if="isImageFile">
      <img
        crossorigin="anonymous"
        :src="asset.attachmentUrl"
        :alt="asset.fileName"
        class="attachment-preview__thumb"
      />
    </template>

    <!-- File extension badge -->
    <template v-else>
      <div
        class="attachment-preview__badge"
        :style="{ backgroundColor: extensionColor }"
      >
        {{ extensionLabel }}
      </div>
      <span class="attachment-preview__name" :title="asset.fileName">
        {{ truncateFileName(asset.fileName) }}
      </span>
    </template>

    <!-- Remove button (not shown during upload) -->
    <button
      v-if="!uploading"
      class="attachment-preview__remove"
      @click.stop="$emit('remove')"
    >
      <VcIcon icon="lucide-x" size="xs" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VcIcon } from "@vc-shell/framework";
import { MessageAttachment } from "@vcmp-communication/api/marketplacecommunication";
import { isImage, getExtension, getExtensionColor } from "../fileUtils";
import { truncateFileName } from "../utils";

const props = defineProps<{
  asset: MessageAttachment;
  uploading?: boolean;
}>();

defineEmits<{
  (e: "remove"): void;
}>();

const isImageFile = computed(() => isImage(props.asset.fileName));
const extensionLabel = computed(() => (getExtension(props.asset.fileName) ?? "FILE").toUpperCase());
const extensionColor = computed(() => getExtensionColor(props.asset.fileName));
</script>

<style lang="scss">
.attachment-preview {
  @apply tw-relative;
  @apply tw-w-[72px] tw-h-[72px];
  @apply tw-rounded-md tw-overflow-hidden;
  @apply tw-border tw-border-solid tw-border-[color:var(--neutrals-200)];
  @apply tw-bg-[color:var(--neutrals-50)];
  @apply tw-flex tw-flex-col tw-items-center tw-justify-center;
  @apply tw-gap-1;
  @apply tw-cursor-default;
  @apply tw-transition-shadow;

  &:hover {
    @apply tw-shadow-sm;
  }

  &--uploading {
    @apply tw-border-dashed;
    @apply tw-border-[color:var(--neutrals-300)];
  }

  // --- Image thumbnail ---
  &__thumb {
    @apply tw-w-full tw-h-full;
    @apply tw-object-cover;
  }

  // --- Extension badge ---
  &__badge {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-9 tw-h-7;
    @apply tw-rounded;
    @apply tw-text-[11px] tw-font-semibold tw-tracking-wide;
    @apply tw-text-white;
  }

  // --- File name ---
  &__name {
    @apply tw-text-[10px] tw-leading-tight;
    @apply tw-text-[color:var(--neutrals-500)];
    @apply tw-max-w-[64px] tw-truncate tw-text-center;
  }

  // --- Remove button ---
  &__remove {
    @apply tw-absolute tw-top-1 tw-right-1;
    @apply tw-w-[18px] tw-h-[18px];
    @apply tw-rounded-full;
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-border-0 tw-cursor-pointer;
    @apply tw-opacity-0;
    @apply tw-transition-opacity;
    background: rgba(0, 0, 0, 0.55);
    color: white;
  }

  &:hover &__remove {
    @apply tw-opacity-100;
  }

  // --- Upload spinner ---
  &__spinner {
    @apply tw-text-[color:var(--neutrals-400)];
    animation: attachment-preview-spin 0.8s linear infinite;
  }

  &__upload-label {
    @apply tw-text-[10px];
    @apply tw-text-[color:var(--neutrals-400)];
  }
}

@keyframes attachment-preview-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
