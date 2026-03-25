<template>
  <VcWidget
    v-loading:500="loading"
    :title="$t('MESSENGER.WIDGET.TITLE')"
    icon="lucide-message-circle"
    :value="messageCount"
    @click="openMessageBlade"
  >
  </VcWidget>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useMessenger } from "../../composables";
import { loading as vLoading, useBlade, injectBladeContext, useWidgetTrigger, VcWidget } from "@vc-shell/framework";

const ctx = injectBladeContext();
const bladeItem = computed(() => ctx.value.item as { id?: string; objectType?: string });
const entityId = computed(() => bladeItem.value?.id ?? "");
const entityType = computed(() => bladeItem.value?.objectType ?? "");

const { getUnreadCount } = useMessenger();
const { openBlade } = useBlade();

const messageCount = ref(0);
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

const populateCounter = async () => {
  try {
    loading.value = true;
    messageCount.value = await getUnreadCount({
      entityId: entityId.value,
      entityType: entityType.value,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
  } finally {
    loading.value = false;
  }
};

useWidgetTrigger({ onRefresh: populateCounter });

onMounted(async () => {
  if (entityId.value) {
    await populateCounter();
  }
});
</script>
