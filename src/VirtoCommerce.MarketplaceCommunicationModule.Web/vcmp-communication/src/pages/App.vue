<template>
  <VcApp
    :is-ready="isReady"
    :logo="logoImage"
    title="Communication App"
    :version="version"
  >
  </VcApp>
</template>

<script lang="ts" setup>
import { updateSignalRCreatorSymbol, useUser } from "@vc-shell/framework";
import { computed, inject, onMounted, provide, ref } from "vue";
// eslint-disable-next-line import/no-unresolved
import logoImage from "/assets/logo.svg";
import { useRoute } from "vue-router";

const isReady = ref(false);
const version = import.meta.env.PACKAGE_VERSION;

const { isAuthenticated } = useUser();
const route = useRoute();
const seller = ref<{ id: string; name: string }>();
const updateSignalRCreator = inject(updateSignalRCreatorSymbol);

onMounted(async () => {
  try {
    if (isAuthenticated.value) {
      seller.value = await getSellerById(GetSellerId());
      updateSignalRCreator?.(seller.value?.id);
      isReady.value = true;
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
});

console.debug(`Initializing App`);

function GetSellerId(): string {
  const result = route?.params?.sellerId as string;
  return result;
}

async function getSellerById(id: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`/api/vcmp/security/seller/${id}`);
  return res.json();
}

provide(
  "currentSeller",
  computed(() => seller.value),
);
</script>

<style lang="scss">
@import "./../styles/index.scss";
</style>
