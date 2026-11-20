<template>
  <!-- legacy product-, offer- and order-communication-widget: the operator's conversation with the entity's seller -->
  <VcWidget
    v-if="hasAccess(PERMISSIONS.READ)"
    icon="lucide-message-circle"
    :title="canChat ? $t('MESSENGER.WIDGET.TITLE') : $t('MARKETPLACE_COMMUNICATION.WIDGETS.NO_SELLER')"
    :value="canChat ? unreadCount : undefined"
    :disabled="!canChat"
    @click="open"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useDebounceFn } from "@vueuse/core";
import {
  injectBladeContext,
  useBlade,
  useBladeNotifications,
  usePermissions,
  useWidgetTrigger,
} from "@vc-shell/framework";
import { VcWidget } from "@vc-shell/framework/ui";
import { useMessageApi, messagesReadVersion } from "../../modules/messenger/composables/useMessageApi";
import type { MessagePushNotification } from "../../modules/messenger/typings";
import { ENTITY_TYPES, PERMISSIONS } from "../constants";
import { useOperator } from "../operator";

const props = defineProps<{ entityType: string }>();

// the entity shared by the host blade via defineBladeContext({ item })
const ctx = injectBladeContext();
const item = computed(() => ctx.value.item as { id?: string; employeeId?: string } | undefined);
const entityId = computed(() => item.value?.id ?? "");

// An order without a seller (a customer order split into seller orders) has nobody to talk to: legacy
// showed "communication is not possible, open a seller order"
const canChat = computed(
  () => !!entityId.value && (props.entityType !== ENTITY_TYPES.ORDER || !!item.value?.employeeId),
);

const { openBlade } = useBlade();
const { hasAccess } = usePermissions();
const { getUnreadCount } = useMessageApi();
const { loadOperator } = useOperator();

const unreadCount = ref<number | string>("…");

async function load() {
  if (!canChat.value || !hasAccess(PERMISSIONS.READ)) return;
  try {
    const operator = await loadOperator();
    // unread for the operator: messages the seller sent to it
    unreadCount.value = await getUnreadCount({
      entityId: entityId.value,
      entityType: props.entityType,
      recipientId: operator.id,
    });
  } catch {
    unreadCount.value = "";
  }
}

function open() {
  if (!canChat.value) return;
  openBlade({ name: "Messenger", options: { entityId: entityId.value, entityType: props.entityType } });
}

watch(entityId, load, { immediate: true });

// a new message of this entity arrives with a push; read ones leave after the messenger marks them
useBladeNotifications<MessagePushNotification>({
  types: ["MessagePushNotification"],
  filter: (m) => m.entityId === entityId.value,
  onMessage: load,
});
watch(messagesReadVersion, useDebounceFn(load, 500));

useWidgetTrigger({ onRefresh: load });
</script>
