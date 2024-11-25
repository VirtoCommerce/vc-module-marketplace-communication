<template>
  <VcBlade
    :title="$t('ALL_MESSAGES.TITLE')"
    :expanded="expanded"
    :closable="closable"
    width="50%"
    :toolbar-items="bladeToolbar"
    @close="$emit('close:blade')"
    @expand="$emit('expand:blade')"
    @collapse="$emit('collapse:blade')"
  >
    <ConversationList
      :conversations="conversations"
      :selected-conversation="selectedConversation"
      :user-name="currentSeller.name"
      :is-loading="loading"
      :has-more="hasMore"
      @select="handleConversationSelect"
      @load-more="handleLoadMore"
    />
  </VcBlade>
</template>

<script setup lang="ts">
import { computed, ComputedRef, inject, onMounted, ref } from "vue";
import { useConversationList } from "../composables";
import { IBladeToolbar, IParentCallArgs, useBladeNavigation } from "@vc-shell/framework";
import type { Conversation } from "../../../api_client/virtocommerce.marketplacecommunication";
import { useI18n } from "vue-i18n";
import { ConversationList } from "../components";

const props = defineProps<{
  expanded?: boolean;
  closable?: boolean;
  param?: string;
}>();

const emit = defineEmits<{
  (event: "parent:call", args: IParentCallArgs): void;
  (event: "close:blade"): void;
  (event: "expand:blade"): void;
  (event: "collapse:blade"): void;
}>();

defineOptions({
  name: "AllMessages",
  notifyType: "MessagePushNotification",
  url: "/communication",
  isWorkspace: true,
  menuItem: {
    title: "ALL_MESSAGES.MENU_TITLE",
    icon: "fas fa-comment",
    priority: 1,
  },
});

const { t } = useI18n({ useScope: "global" });
const { openBlade, resolveBladeByName } = useBladeNavigation();

const selectedConversation = ref<Conversation | null>(null);

const { conversations, loading, getConversations, hasMore, loadMore } = useConversationList();

const currentSeller = inject<ComputedRef<{ id: string; name: string }>>("currentSeller");

if (!currentSeller?.value) {
  throw new Error("Seller is not provided");
}

const bladeToolbar = computed<IBladeToolbar[]>(() => [
  {
    id: "refresh",
    icon: "fas fa-sync-alt",
    title: t("ALL_MESSAGES.TOOLBAR.REFRESH"),
    clickHandler: refresh,
  },
]);

const handleConversationSelect = (conversation: Conversation) => {
  openBlade({
    blade: resolveBladeByName("Messenger"),
    options: {
      entityId: conversation.entityId,
      entityType: conversation.entityType,
    },
    onOpen: () => {
      selectedConversation.value = conversation;
    },
    onClose: () => {
      selectedConversation.value = null;
    },
  });
};

const refresh = async () => {
  if (currentSeller?.value) {
    await getConversations({
      sellerId: currentSeller.value.id,
    });
  }
};

const handleLoadMore = async () => {
  if (currentSeller?.value) {
    await loadMore();
  }
};

onMounted(async () => {
  await refresh();
});

defineExpose({
  refresh,
});
</script>
