<template>
  <VcPopup
    is-mobile-fullscreen
    is-fullscreen
    modal-width="tw-w-full"
    @close="$emit('close')"
  >
    <template #header>
      <div>
        <span>{{ alt }} (</span>
        <VcLink
          class="tw-flex-1"
          @click="copyLink(src)"
        >
          {{ $t("MESSENGER.COPY_IMAGE_LINK") }}
        </VcLink>
        <span>)</span>
      </div>
    </template>
    <template #content>
      <div class="tw-w-full tw-h-full tw-flex tw-justify-center tw-items-center">
        <img
          crossorigin="anonymous"
          :src="src"
          :alt="alt"
        />
      </div>
    </template>
  </VcPopup>
</template>

<script setup lang="ts">
import { MaybeRefOrGetter, toRef } from "@vueuse/core";

const props = defineProps<{
  src: MaybeRefOrGetter<string | undefined>;
  alt: MaybeRefOrGetter<string | undefined>;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const src = toRef(props.src);
const alt = toRef(props.alt);

const copyLink = (link: string | undefined) => {
  if (!link) return;

  if (link.charAt(0) === "/") {
    navigator.clipboard?.writeText(`${location.origin}${link}`);
  } else {
    navigator.clipboard?.writeText(link);
  }
};
</script>
