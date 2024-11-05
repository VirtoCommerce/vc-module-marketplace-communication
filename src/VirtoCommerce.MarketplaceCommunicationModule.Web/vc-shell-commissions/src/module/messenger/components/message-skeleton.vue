<template>
  <div
    class="message-skeleton"
    :class="{ 'message-skeleton--mobile': $isMobile.value }"
  >
    <div class="message-skeleton__header">
      <div class="message-skeleton__avatar"></div>
      <div class="message-skeleton__meta">
        <div class="message-skeleton__name"></div>
        <div class="message-skeleton__date"></div>
      </div>
    </div>
    <div class="message-skeleton__content">
      <div class="message-skeleton__line"></div>
      <div class="message-skeleton__line message-skeleton__line--short"></div>
    </div>
  </div>
</template>

<style lang="scss">
:root {
  --skeleton-bg: var(--additional-50);
}
.message-skeleton {
  @apply tw-p-4 tw-bg-[var(--skeleton-bg)] tw-rounded-lg tw-border tw-border-[color:var(--base-border-color)];

  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  &__header {
    @apply tw-flex tw-items-center tw-gap-3 tw-mb-2;
  }

  &__avatar {
    @apply tw-w-10 tw-h-10 tw-rounded-full;
    background: linear-gradient(90deg, var(--neutrals-100) 25%, var(--neutrals-200) 50%, var(--neutrals-100) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__meta {
    @apply tw-flex tw-flex-col tw-gap-1;
  }

  &__name {
    @apply tw-h-4 tw-w-32 tw-rounded;
    background: linear-gradient(90deg, var(--neutrals-100) 25%, var(--neutrals-200) 50%, var(--neutrals-100) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__date {
    @apply tw-h-3 tw-w-24 tw-rounded;
    background: linear-gradient(90deg, var(--neutrals-100) 25%, var(--neutrals-200) 50%, var(--neutrals-100) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  &__content {
    @apply tw-mt-3 tw-space-y-2;
  }

  &__line {
    @apply tw-h-4 tw-rounded;
    background: linear-gradient(90deg, var(--neutrals-100) 25%, var(--neutrals-200) 50%, var(--neutrals-100) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;

    &--short {
      @apply tw-w-2/3;
    }
  }

  &--mobile {
    @apply tw-p-2;

    .message-skeleton__avatar {
      @apply tw-w-8 tw-h-8;
    }

    .message-skeleton__name {
      @apply tw-w-24;
    }

    .message-skeleton__date {
      @apply tw-w-16;
    }

    .message-skeleton__line {
      @apply tw-w-full;
    }
  }
}
</style>
