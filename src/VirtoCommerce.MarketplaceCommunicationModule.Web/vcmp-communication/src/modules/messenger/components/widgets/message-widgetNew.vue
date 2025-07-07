<template>
  <VcWidget
    v-loading:500="loading"
    :title="$t('MESSENGER.WIDGET.TITLE')"
    icon="material-chat_bubble"
    :value="messageCount"
    @click="openMessageBlade"
  >
  </VcWidget>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMessages } from "../../composables";
import { loading as vLoading, useBladeNavigation, VcWidget } from "@vc-shell/framework";

export interface Props {
  id: string;
  objectType: string;
}

const props = defineProps<Props>();

const { getUnreadCount } = useMessages();
const { openBlade, resolveBladeByName } = useBladeNavigation();

const messageCount = ref(0);
const loading = ref(false);

const openMessageBlade = () => {
  openBlade({
    blade: resolveBladeByName("Messenger"),
    options: {
      entityType: props.objectType,
      entityId: props.id,
    },
  });
};

const populateCounter = async () => {
  try {
    loading.value = true;
    messageCount.value = await getUnreadCount({
      entityId: props.id,
      entityType: props.objectType,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (props.id) {
    await populateCounter();
  }
});

defineExpose({
  updateActiveWidgetCount: populateCounter,
});
</script>
