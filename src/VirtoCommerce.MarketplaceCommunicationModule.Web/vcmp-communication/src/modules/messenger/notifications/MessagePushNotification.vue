<template>
  <NotificationTemplate
    :notification="notification"
    color="var(--success-400)"
    icon="lucide-mail"
    :title="notification.title ?? ''"
    @click="openMessageBlade"
  >
    <VcHint
      v-if="notification.content"
      class="tw-mb-1"
      >{{ notification.content }}</VcHint
    >
  </NotificationTemplate>
</template>

<script lang="ts" setup>
import { BladeStackKey, NotificationTemplate, useNotificationContext } from "@vc-shell/framework";
import { MessagePushNotification } from "../typings";
import { computed, inject } from "vue";
import { useConversationApi } from "../composables/useConversationApi";

import { VcHint } from "@vc-shell/framework/ui";

const notificationRef = useNotificationContext<MessagePushNotification>();
const notification = computed(() => notificationRef.value);

const stack = inject(BladeStackKey)!;
const { getConversationById } = useConversationApi();

// A workspace takes no param, and reopening the open workspace is a no-op, so the conversation is opened
// here: next to the Communication list, in place of any conversation open there.
const openMessageBlade = async () => {
  const conversationId = notification.value.conversationId;
  if (!conversationId) return;
  const conversation = await getConversationById(conversationId);
  await stack.openWorkspace({ name: "AllMessages" });
  const workspaceId = stack.workspace.value?.id;
  if (!workspaceId) return;
  await stack.openBlade({
    name: "Messenger",
    parentId: workspaceId,
    param: notification.value.messageId,
    options: {
      conversation,
      entityId: conversation.entityId,
      entityType: conversation.entityType,
    },
  });
};
</script>
