<template>
  <component
    :is="isImage(asset.fileName) ? 'div' : 'a'"
    v-bind="openFileBindings"
  >
    <div class="asset-item__icon-wrapper">
      <div
        v-if="isImage(asset.fileName)"
        class="asset-item--asset"
      >
        <img
          crossorigin="anonymous"
          :src="createThumbnailLink(asset.attachmentUrl)"
          :alt="asset.fileName"
          class="asset-item__thumb"
        />
      </div>
      <VcIcon
        v-else
        :icon="getFileThumbnail(asset.fileType)"
        class="asset-item__icon"
        size="xl"
      />
    </div>
    <div class="asset-item__info">
      <span
        class="asset-item__name"
        :title="asset.fileName"
      >
        {{ truncateFileName(asset.fileName) }}
      </span>
      <span
        v-if="showSize"
        class="asset-item__size"
      >
        {{ readableSize(asset.fileSize) }}
      </span>
    </div>
    <div class="asset-item__actions">
      <slot name="actions" />
    </div>
  </component>
</template>

<script setup lang="ts">
import { MessageAttachment } from "@vcmp-communication/api/marketplacecommunication";
import { VcIcon } from "@vc-shell/framework";
import { isImage, getFileThumbnail, createThumbnailLink, readableSize } from "../fileUtils";
import { truncateFileName } from "../utils";
import { computed } from "vue";

const props = defineProps<{
  asset: MessageAttachment;
  showSize?: boolean;
}>();

const emit = defineEmits<{
  (e: "preview", asset: MessageAttachment): void;
}>();

const openFileBindings = computed(() => {
  return isImage(props.asset.fileName)
    ? {
        class: "asset-item asset-item--asset",
        onClick: () => emit("preview", props.asset),
      }
    : {
        href: props.asset.attachmentUrl,
        class: "asset-item asset-item--asset",
        target: "_blank",
        download: props.asset.fileName,
      };
});
</script>

<style lang="scss">
.asset-item {
  @apply tw-rounded-lg tw-overflow-hidden;
  @apply tw-transition-all;
  @apply tw-no-underline;
  @apply tw-py-1 tw-px-2;
  @apply tw-cursor-pointer;

  &--asset {
    @apply tw-flex tw-items-center tw-gap-2;
    @apply tw-bg-[color:var(--neutrals-50)];
    @apply tw-relative;
    @apply tw-border tw-border-[color:var(--neutrals-200)];
    @apply hover:tw-bg-[color:var(--neutrals-100)];
    @apply hover:tw-shadow-sm tw-rounded-[4px] tw-overflow-hidden;
  }

  &__thumb {
    @apply tw-w-8 tw-h-8;
    @apply tw-object-cover;
  }

  &__icon-wrapper {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-8 tw-h-8;
    @apply tw-rounded;
    @apply tw-bg-[color:var(--primary-50)];
  }

  &__icon {
    @apply tw-text-[color:var(--primary-500)];
  }

  &__info {
    @apply tw-flex tw-flex-col;
  }

  &__name {
    @apply tw-max-w-[180px] tw-truncate;
    @apply tw-text-sm;
    @apply tw-text-[color:var(--neutrals-950)];
  }

  &__size {
    @apply tw-text-xs tw-text-[color:var(--neutrals-500)];
  }

  &__actions {
    @apply tw-flex tw-items-center tw-gap-2;
  }
}
</style>
