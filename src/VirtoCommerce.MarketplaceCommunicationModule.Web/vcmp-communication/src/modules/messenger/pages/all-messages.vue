<template>
  <VcBlade
    :title="title"
    :expanded="expanded"
    :closable="closable"
    width="50%"
    :toolbar-items="bladeToolbar"
    @close="$emit('close:blade')"
    @expand="$emit('expand:blade')"
    @collapse="$emit('collapse:blade')"
  >
    <ConversationList
      v-if="isReady"
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
import { computed, ComputedRef, inject, onMounted, Ref, ref, watch } from "vue";
import { useConversationList } from "../composables";
import {
  IBladeToolbar,
  IParentCallArgs,
  notification,
  useBladeNavigation,
  useNotifications,
} from "@vc-shell/framework";
import type { Conversation } from "../../../api_client/virtocommerce.marketplacecommunication";
import { useI18n } from "vue-i18n";
import { ConversationList } from "../components";
import { useMounted } from "@vueuse/core";
import { MessagePushNotification } from "../typings";

const props = defineProps<{
  expanded?: boolean;
  closable?: boolean;
  param?: string;
  options?: {
    entityId?: string;
    entityType?: string;
    messageId?: string;
  };
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
    priority: 5,
  },
});

const { t } = useI18n({ useScope: "global" });
const { openBlade, resolveBladeByName } = useBladeNavigation();
const { setNotificationHandler } = useNotifications("MessagePushNotification");

setNotificationHandler(async (notify) => {
  const messageNotify = notify as MessagePushNotification;
  notification(messageNotify.title + ": " + messageNotify.content);
  await load();
});

const selectedConversation = ref<Conversation | null | undefined>(null) as Ref<Conversation | null | undefined>;

const { conversations, loading, getConversations, hasMore, loadMore } = useConversationList();

const currentSeller = inject<ComputedRef<{ id: string; name: string }>>("currentSeller");
const isReady = ref(false);

if (!currentSeller?.value) {
  throw new Error("Seller is not provided");
}

const title = computed(() => t("ALL_MESSAGES.TITLE"));

watch(
  [() => props.param, () => conversations.value, useMounted()],
  async ([conversationId, conversations, mounted]) => {
    if (selectedConversation.value) {
      return;
    }

    if (conversations && conversationId && mounted) {
      selectedConversation.value = conversations.find((c) => c.id === conversationId);

      if (selectedConversation.value) {
        handleConversationSelect(selectedConversation.value, props.options?.messageId);
      }
    } else {
      selectedConversation.value = null;
    }
  },
  { immediate: true },
);

const bladeToolbar = computed<IBladeToolbar[]>(() => [
  {
    id: "refresh",
    icon: "fas fa-sync-alt",
    title: t("ALL_MESSAGES.TOOLBAR.REFRESH"),
    clickHandler: refresh,
  },
]);

function handleConversationSelect(conversation: Conversation, messageId?: string) {
  openBlade({
    blade: resolveBladeByName("Messenger"),
    param: messageId,
    options: {
      conversation,
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
}

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

async function load() {
  if (currentSeller?.value) {
    await refresh();
    isReady.value = true;
  }
}

function expandAllReplies() {
  if (selectedConversation.value) {
    handleConversationSelect(selectedConversation.value, undefined);
  }
}

onMounted(async () => {
  await load();
});

defineExpose({
  title,
  refresh,
  expandAllReplies,
});
</script>
