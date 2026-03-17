<template>
  <div class="message-hover-toolbar">
    <button
      class="message-hover-toolbar__button"
      :title="$t('MESSENGER.HOVER.REPLY')"
      @click="$emit('reply')"
    >
      <VcIcon icon="lucide-reply" size="s" />
    </button>
    <button
      v-if="canEdit"
      class="message-hover-toolbar__button"
      :title="$t('MESSENGER.HOVER.EDIT')"
      @click="$emit('edit')"
    >
      <VcIcon icon="lucide-pencil" size="s" />
    </button>
    <button
      v-if="canDelete"
      class="message-hover-toolbar__button message-hover-toolbar__button--danger"
      :title="$t('MESSENGER.HOVER.DELETE')"
      @click="$emit('delete')"
    >
      <VcIcon icon="lucide-trash-2" size="s" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  canEdit: boolean;
  canDelete: boolean;
}>();

defineEmits<{
  (e: "reply"): void;
  (e: "edit"): void;
  (e: "delete"): void;
}>();
</script>

<style lang="scss">
.message-hover-toolbar {
  @apply tw-flex tw-items-center tw-gap-0.5;
  @apply tw-bg-[color:var(--blade-background-color)];
  @apply tw-border tw-border-solid tw-border-[color:var(--blade-border-color)];
  @apply tw-rounded-md tw-shadow-sm;
  @apply tw-px-1 tw-py-0.5;

  &__button {
    @apply tw-flex tw-items-center tw-justify-center;
    @apply tw-w-7 tw-h-7;
    @apply tw-rounded;
    @apply tw-border-0 tw-bg-transparent;
    @apply tw-cursor-pointer;
    @apply tw-text-[color:var(--neutrals-500)];
    @apply tw-transition-colors;

    &:hover {
      @apply tw-bg-[color:var(--neutrals-100)];
      @apply tw-text-[color:var(--neutrals-700)];
    }

    &--danger:hover {
      @apply tw-bg-[color:var(--danger-50)];
      @apply tw-text-[color:var(--danger-500)];
    }
  }
}
</style>
