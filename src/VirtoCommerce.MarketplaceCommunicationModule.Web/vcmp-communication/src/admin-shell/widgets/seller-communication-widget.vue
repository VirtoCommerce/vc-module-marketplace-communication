<template>
  <!-- legacy seller-communication-widget: the operator's direct conversation with the vendor -->
  <VcWidget
    v-if="hasAccess(PERMISSIONS.READ)"
    icon="lucide-message-circle"
    :title="$t('MESSENGER.WIDGET.TITLE')"
    :value="seller?.id ? unreadCount : undefined"
    :disabled="!seller?.id || opening"
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
  usePopup,
  useWidgetTrigger,
} from "@vc-shell/framework";
import { VcWidget } from "@vc-shell/framework/ui";
import { useConversationApi } from "../../modules/messenger/composables/useConversationApi";
import { useMessageApi, messagesReadVersion } from "../../modules/messenger/composables/useMessageApi";
import type { MessagePushNotification } from "../../modules/messenger/typings";
import { PERMISSIONS } from "../constants";
import { useOperator } from "../operator";

// the seller shared by the vendor plugin's MarketplaceSellerDetails via defineBladeContext({ item })
const ctx = injectBladeContext();
const seller = computed(() => ctx.value.item as { id?: string; name?: string; logo?: string } | undefined);

const { openBlade } = useBlade();
const { hasAccess } = usePermissions();
const { showError } = usePopup();
const { createConversation } = useConversationApi();
const { getUnreadCount } = useMessageApi();
const { loadOperator } = useOperator();

const opening = ref(false);
const unreadCount = ref<number | string>("…");

async function load() {
  if (!seller.value?.id || !hasAccess(PERMISSIONS.READ)) return;
  try {
    const operator = await loadOperator();
    // no entity: the backend counts the direct conversation of the operator and this seller (0 when there is none)
    unreadCount.value = await getUnreadCount({ sellerId: seller.value.id, recipientId: operator.id });
  } catch {
    unreadCount.value = "";
  }
}

async function open() {
  if (!seller.value?.id || opening.value) return;
  opening.value = true;
  try {
    const operator = await loadOperator();
    // gets the existing operator-seller conversation or starts one; the backend adds the seller's user
    // (the vendor portal's "Operator chat" opens the same conversation)
    const conversation = await createConversation({
      sellerId: seller.value.id,
      sellerName: seller.value.name ?? "",
      userIds: [operator.id!],
      iconUrl: seller.value.logo,
    });
    await openBlade({ name: "Messenger", options: { conversation, title: seller.value.name } });
  } catch (error) {
    showError(error instanceof Error ? error.message : String(error));
  } finally {
    opening.value = false;
  }
}

watch(() => seller.value?.id, load, { immediate: true });

// a direct message carries no entity; read ones leave after the messenger marks them
useBladeNotifications<MessagePushNotification>({
  types: ["MessagePushNotification"],
  filter: (m) => !m.entityId,
  onMessage: load,
});
watch(messagesReadVersion, useDebounceFn(load, 500));

useWidgetTrigger({ onRefresh: load });
</script>
