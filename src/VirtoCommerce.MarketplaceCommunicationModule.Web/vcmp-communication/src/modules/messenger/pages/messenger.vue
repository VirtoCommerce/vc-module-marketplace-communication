<template>
  <VcBlade
    :title="bladeTitle"
    :closable="true"
    :expanded="expanded"
    width="50%"
    class="messenger"
    :class="{ 'messenger--mobile': $isMobile.value }"
    @close="$emit('close:blade')"
    @expand="$emit('expand:blade')"
    @collapse="$emit('collapse:blade')"
  >
    <div class="messenger__content">
      <!-- Header with entity info -->
      <div
        v-if="options?.entityId && options?.entityType && store.conversation.value"
        class="messenger__header"
      >
        <div class="messenger__header-content">
          <VcImage
            size="m"
            :src="store.conversation.value.iconUrl"
          />
          <VcLink
            class="tw-text-lg tw-font-medium"
            @click="goToEntity"
            >{{ store.conversation.value.name }}</VcLink
          >
        </div>
      </div>

      <template v-if="initLoading">
        <div class="tw-flex tw-flex-col tw-gap-2 tw-p-4">
          <MessageSkeleton
            v-for="n in 5"
            :key="n"
          />
        </div>
      </template>
      <MessageList v-else />
    </div>
  </VcBlade>
</template>

<script setup lang="ts">
import { computed, ref, provide, onMounted, inject, type Ref } from "vue";
import { IParentCallArgs, useBladeNavigation } from "@vc-shell/framework";
import { Conversation } from "@vcmp-communication/api/marketplacecommunication";
import { useI18n } from "vue-i18n";
import { createMessengerStore } from "../composables/useMessengerStore";
import { messengerStoreKey, messengerContextKey } from "../injection-keys";
import { MessageList, MessageSkeleton } from "../components";
import { EntityToBlade } from "../typings";

export interface Props {
  expanded?: boolean;
  closable?: boolean;
  param?: string;
  options?: {
    conversation?: Conversation;
    entityId?: string;
    entityType?: string;
  };
}

export interface Emits {
  (event: "parent:call", args: IParentCallArgs): void;
  (event: "close:blade"): void;
  (event: "expand:blade"): void;
  (event: "collapse:blade"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

defineOptions({
  name: "Messenger",
  notifyType: "MessagePushNotification",
});

const { t } = useI18n();
const { openBlade, resolveBladeByName } = useBladeNavigation();
const currentSeller = inject("currentSeller") as Ref<{ id: string; name: string }>;

const bladeTitle = computed(() => t("MESSENGER.TITLE"));
const initLoading = ref(false);

// --- Create and provide per-blade scoped store ---
const store = createMessengerStore();
provide(messengerStoreKey, store);

// --- Provide context ---
provide(messengerContextKey, {
  entityId: props.options?.entityId,
  entityType: props.options?.entityType,
  sellerId: currentSeller.value.id,
  sellerName: currentSeller.value.name,
  conversation: store.conversation,
});

// --- Initialize ---
onMounted(async () => {
  try {
    initLoading.value = true;
    await store.initializeConversation({
      entityId: props.options?.entityId,
      entityType: props.options?.entityType,
      conversation: props.options?.conversation,
    });

    await store.loadMessages({
      entityId: props.options?.entityId,
      entityType: props.options?.entityType,
      responseGroup: "Full",
      conversationId: store.conversation.value?.id,
    });
  } catch (error) {
    console.error("Error initializing messenger:", error);
  } finally {
    initLoading.value = false;
  }
});

function goToEntity() {
  if (props.options?.entityId && props.options?.entityType) {
    openBlade({
      blade: { name: EntityToBlade[props.options.entityType as keyof typeof EntityToBlade] },
      param: props.options.entityId,
    });
  }
}

defineExpose({
  title: bladeTitle,
});
</script>

<style lang="scss">
.messenger {
  @apply tw-w-full tw-flex tw-flex-col tw-h-full;

  .vc-blade__content {
    @apply tw-p-0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    @apply tw-bg-[color:var(--additional-50)];
  }

  &__header {
    @apply tw-sticky tw-top-0 tw-z-10;
    @apply tw-px-4 tw-py-3;
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-border-b tw-border-solid tw-border-[color:var(--neutrals-100)];
  }

  &__header-content {
    @apply tw-flex tw-items-center tw-gap-3;
  }
}
</style>
