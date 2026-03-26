<template>
  <div class="message-skeleton">
    <div class="message-skeleton__bubble">
      <div class="message-skeleton__author" />
      <div class="message-skeleton__content">
        <div class="message-skeleton__line" />
        <div class="message-skeleton__line message-skeleton__line--medium" />
      </div>
      <div class="message-skeleton__time" />
    </div>
  </div>
</template>

<style lang="scss">
@keyframes skeleton-shimmer {
  0% { background-position: -200px 0; }
  100% { background-position: 200px 0; }
}

%skeleton-block {
  background: linear-gradient(90deg, var(--neutrals-100) 25%, var(--neutrals-200) 50%, var(--neutrals-100) 75%);
  background-size: 400px 100%;
  animation: skeleton-shimmer 1.5s infinite;
  border-radius: 4px;
}

.message-skeleton {
  display: flex;
  padding: 4px 16px;

  &__bubble {
    max-width: 70%;
    min-width: 200px;
    padding: 8px 12px;
    border-radius: 12px;
    background-color: var(--neutrals-50);
    border: 1px solid var(--neutrals-200);
  }

  &__author {
    @extend %skeleton-block;
    width: 80px;
    height: 14px;
    margin-bottom: 4px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__line {
    @extend %skeleton-block;
    width: 100%;
    height: 14px;

    &--medium {
      width: 60%;
    }
  }

  &__time {
    @extend %skeleton-block;
    width: 40px;
    height: 10px;
    margin-top: 4px;
    margin-left: auto;
  }
}
</style>
