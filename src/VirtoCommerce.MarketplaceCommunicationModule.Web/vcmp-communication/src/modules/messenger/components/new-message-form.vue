<template>
  <div
    v-loading="loading"
    class="new-message-form"
  >
    <VcInput
      v-if="!isExpanded && !message?.content"
      type="text"
      :placeholder="$t('MESSENGER.ADD_COMMENT')"
      class="new-message-form__input"
      @focus="expandForm"
    />
    <form
      v-else
      class="new-message-form__expanded"
      @submit.prevent="send"
    >
      <VcTextarea
        ref="textareaRef"
        v-model="content"
        :placeholder="$t('MESSENGER.ENTER_MESSAGE')"
        class="new-message-form__content"
      />
      <div class="new-message-form__actions">
        <VcButton
          type="button"
          small
          icon="fas fa-times"
          class="new-message-form__cancel"
          @click="cancel"
        >
          {{ $t("MESSENGER.CANCEL") }}
        </VcButton>
        <VcButton
          type="submit"
          :disabled="!content.trim()"
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
import { ref, computed, watch, inject, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { Message } from "@vcmp-communication/api/marketplacecommunication";
import { loading as vLoading, VcTextarea, VcButton } from "@vc-shell/framework";

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
    },
  ): void;
  (e: "collapse"): void;
  (e: "expand"): void;
  (
    e: "update-message",
    args: {
      content: string;
      messageId: string;
    },
  ): void;
}>();

const { t } = useI18n();

const entityId = inject("entityId") as string;
const entityType = inject("entityType") as string;

const content = ref(props.isEdit ? props.message?.content || "" : "");
const textareaRef = ref<InstanceType<typeof VcTextarea>>();

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
      });
      if (!props.message?.content) {
        content.value = "";

        emit("collapse");
      }
    }
  }
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
</script>

<style lang="scss">
:root {
  --new-message-form-background-color: var(--blade-background-color, var(--additional-50));
}

.new-message-form {
  @apply tw-w-full tw-bg-[--new-message-form-background-color];

  &__expanded {
    @apply tw-flex tw-flex-col tw-gap-0;
  }

  &__content {
    @apply tw-w-full tw-min-h-[85px] tw-resize-y tw-py-2;
    @apply tw-bg-[color:var(--blade-background-color)];

    .vc-textarea__field {
      @apply tw-min-h-[85px];
    }
  }

  &__submit {
    @apply tw-self-end;
  }

  &__actions {
    @apply tw-flex tw-gap-2 tw-mt-2;
  }
}
</style>
