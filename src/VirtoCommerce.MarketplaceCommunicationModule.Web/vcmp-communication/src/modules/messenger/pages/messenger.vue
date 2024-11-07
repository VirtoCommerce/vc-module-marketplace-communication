<template>
  <VcBlade
    :title="$t('MESSENGER.TITLE')"
    :closable="true"
    :expanded="expanded"
    width="50%"
    class="messenger"
    :class="{ 'messenger--mobile': $isMobile.value }"
    @close="$emit('close:blade')"
    @expand="$emit('expand:blade')"
    @collapse="$emit('collapse:blade')"
  >
    <div class="messenger__content">
      <div
        ref="threadsInner"
        class="messenger__threads-container"
      >
        <!-- Previous replies loader -->
        <div
          v-if="hasOlderMessages && !(previousLoading || searchMessagesLoading)"
          ref="previousLoader"
          class="messenger__loader"
        ></div>

        <div
          v-if="hasOlderMessages && (previousLoading || searchMessagesLoading)"
          class="messenger__loader-content"
        >
          <MessageSkeleton
            v-for="n in 10"
            :key="n"
            class="messenger__skeleton"
          />
        </div>

        <template v-if="props.param && loadedThread?.length">
          <MessageTree
            v-for="message in loadedThread"
            :key="message.id"
            :message="message"
            :target-message-id="targetMessageId"
            @update-parent-message="updateParentMessage"
            @remove-parent-message="removeParentMessage"
            @mark-read="markMessageAsRead"
          />
        </template>

        <template v-else>
          <template v-if="searchMessagesLoading">
            <MessageSkeleton
              v-for="n in 10"
              :key="n"
              class="messenger__skeleton"
            />
          </template>

          <template v-else>
            <!-- Root messages -->
            <MessageTree
              v-for="message in rootMessages"
              :key="message.id"
              :message="message"
              :target-message-id="targetMessageId"
              @update-parent-message="updateParentMessage"
              @remove-parent-message="removeParentMessage"
              @mark-read="markMessageAsRead"
            />
          </template>


            <div class="tw-w-full tw-h-full tw-box-border tw-flex tw-flex-col tw-items-center tw-justify-center"  v-if="!rootMessages.length">
              <VcIcon
                icon="fas fa-comment"
                class="tw-text-[color:var(--empty-communication)]"
                size="xxxl"
              />
              <div class="tw-m-4 tw-text-xl tw-font-medium">
                {{ $t("MESSENGER.NO_MESSAGES") }}
              </div>
              <VcButton @click="setActiveForm('main', null)">{{ $t("MESSENGER.NEW_MESSAGE") }}</VcButton>
            </div>

        </template>

        <div
          v-if="(nextLoading || searchMessagesLoading) && hasNewerMessages"
          class="messenger__loader-content"
        >
          <MessageSkeleton
            v-for="n in 10"
            :key="n"
            class="messenger__skeleton"
          />
        </div>

        <div
          v-if="hasNewerMessages && !(nextLoading || searchMessagesLoading)"
          ref="nextLoader"
          class="messenger__loader"
        ></div>
      </div>
      <div class="messenger__form-container">
        <NewMessageForm
          v-if="options?.entityId"
          class="messenger__new-message-form"
          :is-expanded="activeForm.type === 'main'"
          :loading="sendMessageLoading"
          @send="sendRootMessage"
          @collapse="setActiveForm(null, null)"
          @expand="expandMainForm"
        />
      </div>
    </div>
  </VcBlade>
</template>

<script setup lang="ts">
import { computed, ref, provide, onMounted, nextTick, inject, Ref } from "vue";
import { useMessages } from "../composables";
import NewMessageForm from "../components/new-message-form.vue";
import { IParentCallArgs } from "@vc-shell/framework";
import { Message, MessageRecipient, ISearchMessagesQuery } from "@vcmp-communication/api/marketplacecommunication";
import * as _ from "lodash-es";
import MessageSkeleton from "../components/message-skeleton.vue";
import MessageTree from "../components/message-tree.vue";
import { useInfiniteScroll } from "../composables/useInfiniteScroll";
import { useI18n } from "vue-i18n";

export interface Props {
  expanded?: boolean;
  closable?: boolean;
  param?: string;
  options?: {
    entityId?: string;
    entityType?: string;
  };
}

export interface Emits {
  (event: "parent:call", args: IParentCallArgs): void;
  (event: "close:blade"): void;
  (event: "expand:blade"): void;
  (event: "collapse:blade"): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

defineOptions({
  name: "Messenger",
  notifyType: "MessagePushNotification",
});

const {
  messages,
  sendMessage,
  searchMessages,
  searchQuery,
  getOperator,
  getRootMessages,
  loadMoreMessages,
  searchMessagesLoading,
  updateMessage,
  removeMessage,
  hasOlderMessages,
  hasNewerMessages,
  loadPreviousMessages,
  sendMessageLoading,
  operator,
  getSeller,
  seller,
  getThread,
  loadedThread,
} = useMessages();

const { t } = useI18n();
const rootMessages = computed(() => getRootMessages());

const targetMessageId = ref<string | null>(null);

const threadsInner = ref<HTMLElement | null>(null);
const previousLoader = ref<HTMLElement | null>(null);
const nextLoader = ref<HTMLElement | null>(null);

const currentSeller = inject("currentSeller") as Ref<{ id: string; name: string }>;

const activeForm = ref<{ type: "main" | "reply" | "edit" | null; id: string | null }>({ type: null, id: null });

const setActiveForm = (formType: "main" | "reply" | "edit" | null, formId: string | null) => {
  activeForm.value = { type: formType, id: formId };
};

const expandMainForm = () => {
  setActiveForm("main", "main");
};

provide("activeForm", activeForm);
provide("setActiveForm", setActiveForm);
provide("entityType", props.options?.entityType);
provide("entityId", props.options?.entityId);
provide("updateMessage", update);
provide("removeMessage", remove);
provide("sellerId", currentSeller.value?.id);
provide("sellerName", currentSeller.value?.name);
provide("operator", operator);
provide("seller", seller);

async function markMessageAsRead(args: { messageId: string; recipientId: string }) {
  messages.value = messages.value?.map((m) =>
    m.id === args.messageId
      ? new Message({
          ...m,
          recipients: m.recipients?.map((r) =>
            r.recipientId === args.recipientId ? new MessageRecipient({ ...r, readStatus: "Read" }) : r,
          ),
        })
      : m,
  );
}

async function updateParentMessage(message: Message) {
  messages.value = messages.value?.map((m) => (m.id === message.id ? message : m));
}

async function removeParentMessage(message: Message) {
  messages.value = messages.value?.filter((m) => m.id !== message.id);
}

async function remove(args: { messageIds: string[]; withReplies: boolean }) {
  await removeMessage(args);
}

async function update(args: { content: string; messageId: string }) {
  await updateMessage(args);
}

// Add new ref for tracking programmatic scroll
const isProgrammaticScroll = ref(false);

async function sendRootMessage(args: {
  content: string;
  replyTo: string | undefined;
  entityId: string;
  entityType: string;
}) {
  if (props.options?.entityId) {
    const newMessage = await sendMessage({
      ...args,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
      rootsOnly: true,
    });

    // Scroll to new message after it's rendered
    if (newMessage) {
      nextTick(() => {
        const messageElement = threadsInner.value?.querySelector(`[data-message-id="${newMessage.id}"]`);
        if (messageElement) {
          isProgrammaticScroll.value = true; // Set flag before scroll
          messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

          // Reset flag after animation completes (approximately 300ms for smooth scroll)
          setTimeout(() => {
            isProgrammaticScroll.value = false;
          }, 1000); // Using 1000ms to ensure scroll completes
        }
      });
    }
  }
}

async function search(query?: ISearchMessagesQuery) {
  await searchMessages({
    ...(query ?? {}),
    entityId: props.options?.entityId,
    entityType: props.options?.entityType,
    rootsOnly: true,
    responseGroup: "Full",
  });
}

onMounted(async () => {
  if (props.param) {
    await getThread(props.param);

    return;
  }
  if (props.options?.entityId && props.options?.entityType) {
    await search();
    await getOperator();
    await getSeller({
      entityId: props.options?.entityId,
      entityType: props.options?.entityType,
    });
  }
});

const { previousLoading, nextLoading } = useInfiniteScroll({
  containerRef: threadsInner,
  previousLoader,
  nextLoader,
  onPreviousIntersection: () => loadPreviousMessages({ rootsOnly: true }),
  onNextIntersection: () => loadMoreMessages({ ...searchQuery.value, rootsOnly: true }),
  isProgrammaticScroll,
  hasOlderItems: hasOlderMessages,
  hasNewerItems: hasNewerMessages,
  isLoading: searchMessagesLoading,
});

defineExpose({
  title: computed(() => t("MESSENGER.TITLE")),
});
</script>

<style lang="scss">
:root {
  --messenger-form-border-color: var(--base-border-color, var(--neutrals-200));
}

.messenger {
  &--mobile {
    @apply tw-w-full tw-h-full;
  }

  &__content {
    @apply tw-flex tw-flex-col tw-h-full;
  }

  &__threads-container {
    @apply tw-flex-grow tw-overflow-y-auto tw-flex tw-flex-col tw-p-4 tw-gap-4;
    scroll-behavior: smooth;

    // Prevent iOS bounce scroll
    overscroll-behavior: contain;
  }

  &__threads {
    @apply tw-flex tw-flex-col tw-gap-4;
    // Add padding to ensure loaders are visible
    @apply tw-py-4;
  }

  &__threads-inner {
    @apply tw-flex tw-flex-col tw-gap-2;
  }

  &__form-container {
    @apply tw-flex-shrink-0;
  }

  &__new-message-form {
    @apply tw-p-4 tw-border-t tw-border-t-[--messenger-form-border-color];
  }

  &--mobile &__threads {
    @apply tw-gap-2;
  }

  &--mobile &__new-message-form {
    @apply tw-p-2;
  }

  &__skeleton {
    @apply tw-mb-2;

    &:last-child {
      @apply tw-mb-0;
    }
  }

  &__load-more-button {
    @apply tw-mt-2 tw-text-sm tw-text-[color:var(--primary-color)];
  }

  &__load-previous-button {
    @apply tw-mb-2 tw-text-sm tw-text-[color:var(--primary-color)];
  }

  &__loader-container {
    @apply tw-min-h-[60px] tw-flex tw-items-center tw-justify-center;
  }

  &__loader-content {
    @apply tw-w-full;
  }
}
</style>
