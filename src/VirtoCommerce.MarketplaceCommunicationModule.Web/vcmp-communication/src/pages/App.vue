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
import { useUser, useBroadcastFilter } from "@vc-shell/framework";
import { computed, onMounted, provide, ref } from "vue";
// eslint-disable-next-line import/no-unresolved
import logoImage from "/assets/logo.svg";
import { useRoute } from "vue-router";

import { VcApp } from "@vc-shell/framework/ui";

const isReady = ref(false);
const version = import.meta.env.PACKAGE_VERSION;

const { isAuthenticated } = useUser();
const { setBroadcastFilter } = useBroadcastFilter();
const route = useRoute();
const seller = ref<{ id: string; name: string }>();

onMounted(async () => {
  try {
    if (isAuthenticated.value) {
      seller.value = await getSellerById(GetSellerId());
      setBroadcastFilter((msg) => msg.creator === seller.value?.id);
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
@use "./../styles/index.scss";
</style>
