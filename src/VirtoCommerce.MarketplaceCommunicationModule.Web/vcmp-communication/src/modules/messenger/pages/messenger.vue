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
        v-if="options?.entityId && options?.entityType && options?.conversation"
        class="messenger__header"
      >
        <div class="messenger__header-content">
          <VcImage
            size="m"
            :src="options.conversation.iconUrl"
          />
          <VcLink
            class="tw-text-lg tw-font-medium"
            @click="goToEntity"
            >{{ options.conversation.name }}</VcLink
          >
        </div>
      </div>
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
          <VcButton
            text
            @click="expandAllReplies"
            >{{ $t("MESSENGER.EXPAND_ALL_REPLIES") }}</VcButton
          >
          <MessageTree
            v-for="message in loadedThread"
            :key="message.id"
            :message="message"
            :target-message-id="targetMessageId"
            is-thread-view
            @update-parent-message="updateParentThreadMessage"
            @remove-parent-message="removeParentThreadMessage"
            @mark-read="markThreadMessageAsRead"
            @update="updateParent"
          />
        </template>

        <template v-else>
          <template v-if="isLoading">
            <MessageSkeleton
              v-for="n in 10"
              :key="'skeleton-top-' + n"
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
              @update="updateParent"
            />
          </template>

          <div
            v-if="!isLoading && !rootMessages.length"
            class="tw-w-full tw-h-full tw-box-border tw-flex tw-flex-col tw-items-center tw-justify-center"
          >
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
            :key="'skeleton-bottom-' + n"
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
import { IParentCallArgs, useBladeNavigation, useLoading } from "@vc-shell/framework";
import {
  Message,
  MessageRecipient,
  ISearchMessagesQuery,
  Conversation,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";
import MessageSkeleton from "../components/message-skeleton.vue";
import MessageTree from "../components/message-tree.vue";
import { useInfiniteScroll } from "../composables/useInfiniteScroll";
import { useI18n } from "vue-i18n";
import { EntityToBlade } from "../typings";

export interface Props {
  expanded?: boolean;
  closable?: boolean;
  param?: string;
  options?: {
    conversation?: Conversation;
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
  createConversation,
  getConversation,
  getSettings,
  settings,
  getSettingsLoading,
  getOperatorLoading,
} = useMessages();

const { t } = useI18n();
const rootMessages = computed(() => getRootMessages());

const { openBlade, resolveBladeByName } = useBladeNavigation();

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
provide("sellerId", currentSeller?.value?.id);
provide("sellerName", currentSeller?.value?.name);
provide("operator", operator);
provide("seller", seller);
provide("conversation", props.options?.conversation);
provide("settings", settings);

function expandAllReplies() {
  emit("parent:call", {
    method: "expandAllReplies",
  });
}

function updateParent() {
  emit("parent:call", {
    method: "refresh",
  });
}

function updateParentThreadMessage(message: Message) {
  loadedThread.value = loadedThread.value?.map((m) => (m.id === message.id ? message : m));
}

function removeParentThreadMessage(message: Message) {
  loadedThread.value = loadedThread.value?.filter((m) => m.id !== message.id);
}

function markThreadMessageAsRead(args: { messageId: string; recipientId: string }) {
  loadedThread.value = loadedThread.value?.map((m) =>
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

  updateParent();
}

async function removeParentMessage(message: Message) {
  messages.value = messages.value?.filter((m) => m.id !== message.id);

  updateParent();
}

async function remove(args: { messageIds: string[]; withReplies: boolean }) {
  await removeMessage(args);

  updateParent();
}

async function update(args: { content: string; messageId: string; attachments: MessageAttachment[] }) {
  await updateMessage(args);

  updateParent();
}

// Add new ref for tracking programmatic scroll
const isProgrammaticScroll = ref(false);

async function sendRootMessage(args: {
  content: string;
  replyTo: string | undefined;
  entityId: string;
  entityType: string;
  attachments: MessageAttachment[];
}) {
  try {
    // create conversation if it doesn't exist
    const conversation = await createConversation({
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
      userIds: [operator.value?.id ?? ""],
      iconUrl: props.options?.conversation?.iconUrl,
      entityId: props.options?.entityId,
      entityType: props.options?.entityType,
    });

    const newMessage = await sendMessage({
      ...args,
      sellerId: currentSeller.value?.id,
      sellerName: currentSeller.value?.name,
      rootsOnly: true,
      conversationId: conversation?.id ?? undefined,
    });

    updateParent();

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
  } catch (error) {
    console.error(error);
  }
}

async function search(query?: ISearchMessagesQuery) {
  let conversationId = props.options?.conversation?.id ?? undefined;

  if (!props.options?.conversation?.id && props.options?.entityId && props.options?.entityType) {
    const conversation = await getConversation(props.options?.entityId, props.options?.entityType);
    conversationId = conversation.id;
  }

  await searchMessages({
    ...(query ?? {}),
    entityId: props.options?.entityId,
    entityType: props.options?.entityType,
    rootsOnly: true,
    responseGroup: "Full",
    conversationId: conversationId,
  });
}

onMounted(async () => {
  await getOperator();
  await getSettings();
  if (props.param) {
    await getThread(props.param);

    return;
  }

  await search();

  if (props.options?.entityId && props.options?.entityType) {
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

function goToEntity() {
  if (props.options?.entityId && props.options?.entityType) {
    openBlade({
      blade: resolveBladeByName(EntityToBlade[props.options.entityType as keyof typeof EntityToBlade]),
      param: props.options.entityId,
    });
  }
}

const isLoading = useLoading(getOperatorLoading, getSettingsLoading, searchMessagesLoading);

defineExpose({
  title: computed(() => t("MESSENGER.TITLE")),
});
</script>

<style lang="scss">
:root {
  --messenger-form-border-color: var(--base-border-color, var(--neutrals-200));
  --messenger-header-bg-color: var(--neutrals-50);
}

.messenger {
  &--mobile {
    @apply tw-w-full tw-h-full;
  }

  &__header {
    @apply tw-flex tw-items-center tw-gap-2 tw-px-4 tw-pt-4 tw-pb-2;
  }

  &__header-content {
    @apply tw-p-2 tw-bg-[--messenger-header-bg-color] tw-border tw-border-solid tw-border-[--messenger-form-border-color] tw-flex tw-items-center tw-gap-3 tw-flex-auto;
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
