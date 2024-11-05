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
import { loading as vLoading, useBladeNavigation } from "@vc-shell/framework";

export interface Props {
  modelValue: {
    item: {
      id: string;
    };
    settings: {
      id: string;
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
      entityType: props.modelValue?.settings.id,
      entityId: props.modelValue?.item?.id,
    },
  });
};

const populateCounter = async () => {
  try {
    loading.value = true;
    messageCount.value = await getUnreadCount({
      entityId: props.modelValue?.item?.id,
      entityType: props.modelValue?.settings.id,
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

<style scoped>
.message-widget {
  position: relative;
  cursor: pointer;
}

.message-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #ccc;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
}

.new-messages {
  background-color: red;
  color: white;
}
</style>
