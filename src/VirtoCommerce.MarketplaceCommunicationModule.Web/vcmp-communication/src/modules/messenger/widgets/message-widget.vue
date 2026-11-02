<template>
  <VcWidget
    :loading="loading"
    :title="$t('MESSENGER.WIDGET.TITLE')"
    icon="lucide-message-circle"
    :value="unreadCount"
    @click="openMessageBlade"
  >
  </VcWidget>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import { useMessageApi, messagesReadVersion } from "../composables/useMessageApi";
import {
  useBlade,
  injectBladeContext,
  useWidgetTrigger,
  useBladeNotifications,
  type IWidgetAlert,
} from "@vc-shell/framework";
import type { Message } from "@vcmp-communication/api/marketplacecommunication";
import type { MessagePushNotification } from "../typings";

import { VcWidget } from "@vc-shell/framework/ui";

const ctx = injectBladeContext();
const bladeItem = computed(() => ctx.value.item as { id?: string; objectType?: string });
const entityId = computed(() => bladeItem.value?.id ?? "");
const entityType = computed(() => bladeItem.value?.objectType ?? "");

const { searchMessages } = useMessageApi();
const { openBlade } = useBlade();

const unread = ref<Message[]>([]);
const unreadCount = ref(0);
const loading = ref(false);

const openMessageBlade = () => {
  openBlade({
    name: "Messenger",
    options: {
      entityType: entityType.value,
      entityId: entityId.value,
    },
  });
};

const load = async () => {
  if (!entityId.value) return;
  const result = await searchMessages({
    entityId: entityId.value,
    entityType: entityType.value,
    unreadOnly: true,
    sort: "createdDate:desc",
    take: 20,
  });
  unread.value = result.results ?? [];
  unreadCount.value = result.totalCount ?? 0;
};

// Unread messages are the alerts: a new one arrives with a push, a read one leaves on refetch
const alerts = computed<IWidgetAlert[]>(() =>
  unread.value.map((m) => ({ id: m.id!, severity: "info", text: m.content ?? "", onOpen: openMessageBlade })),
);

useBladeNotifications<MessagePushNotification>({
  types: ["MessagePushNotification"],
  filter: (m) => m.entityId === entityId.value,
  onMessage: load,
});

// The Messenger marks messages read in bursts; refetch once
watch(messagesReadVersion, useDebounceFn(load, 500));

useWidgetTrigger({ onRefresh: load, alerts });

onMounted(async () => {
  loading.value = true;
  await load().finally(() => (loading.value = false));
});
</script>
