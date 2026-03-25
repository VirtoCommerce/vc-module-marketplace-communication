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
import { NotificationTemplate, VcHint, useBlade, useNotificationContext } from "@vc-shell/framework";
import { MessagePushNotification } from "../typings";
import { computed } from "vue";

const notificationRef = useNotificationContext<MessagePushNotification>();
const notification = computed(() => notificationRef.value);

const { openBlade } = useBlade();

const openMessageBlade = async () => {
  await openBlade({
    name: "AllMessages",
    param: notification.value.conversationId,
    options: {
      messageId: notification.value.messageId,
    },
    isWorkspace: true,
  });
};
</script>
