<template>
  <NotificationTemplate
    :notification="notification"
    color="var(--success-400)"
    icon="fas fa-envelope"
    :title="notification.title ?? ''"
  >
    <VcHint
      v-if="notification.content"
      class="tw-mb-1"
      >{{ notification.content }}</VcHint
    >
  </NotificationTemplate>
</template>

<script lang="ts" setup>
import { NotificationTemplate, useBladeNavigation, PushNotification, VcHint } from "@vc-shell/framework";

interface MessagePushNotification extends PushNotification {
  content: string;
  notifyType: "MessagePushNotification";
  senderId: string;
  messageId: string;
  entityType: string;
  entityId: string;
}

export interface Props {
  notification: MessagePushNotification;
  variant: string;
}

export interface Emits {
  (event: "notificationClick"): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

defineOptions({
  inheritAttrs: false,
  notifyType: "MessagePushNotification",
});

const { openBlade, resolveBladeByName } = useBladeNavigation();

const openMessageBlade = () => {
  emit("notificationClick");
  openBlade({
    blade: resolveBladeByName("Messenger"),
    param: props.notification.messageId,
    options: {
      entityType: props.notification.entityType,
      entityId: props.notification.entityId,
    }
  });
};

</script>
