<template>
  <VcWidget
    v-if="modelValue.item?.id"
    v-loading:500="loading"
    :title="$t('MESSENGER.WIDGET.TITLE')"
    icon="fas fa-comment"
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
  modelValue: {
    item: {
      id: string;
      objectType: string;
    };
  };
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
      entityType: props.modelValue?.item?.objectType,
      entityId: props.modelValue?.item?.id,
    },
  });
};

const populateCounter = async () => {
  try {
    loading.value = true;
    messageCount.value = await getUnreadCount({
      entityId: props.modelValue?.item?.id,
      entityType: props.modelValue?.item?.objectType,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  if (props.modelValue?.item?.id) {
    await populateCounter();
  }
});

defineExpose({
  updateActiveWidgetCount: populateCounter,
});
</script>
