<template>
  <NotificationTemplate
    :notification="notification"
    color="var(--success-400)"
    icon="material-mail"
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
import { NotificationTemplate, useBladeNavigation, PushNotification, VcHint } from "@vc-shell/framework";
import { MessagePushNotification } from "../../typings";



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

const openMessageBlade = async () => {
  await openBlade(
    {
      blade: resolveBladeByName("AllMessages"),
      param: props.notification.conversationId,
      options: {
        messageId: props.notification.messageId,
      }
    },
    true,
  );
};
</script>
