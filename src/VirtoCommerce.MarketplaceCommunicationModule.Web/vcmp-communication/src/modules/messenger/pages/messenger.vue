<template>
  <VcBlade
    :title="bladeTitle"
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
        v-if="options?.entityId && options?.entityType && conversation"
        class="messenger__header"
      >
        <div class="messenger__header-content">
          <VcImage
            size="m"
            :src="conversation.iconUrl"
          />
          <VcLink
            class="tw-text-lg tw-font-medium"
            @click="goToEntity"
            >{{ conversation.name }}</VcLink
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
              icon="material-chat_bubble"
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
import { useMessenger } from "../composables";
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
  getThread,
  seller,
  loadedThread,
  getConversation,
  getSettings,
  settings,
  getSettingsLoading,
  getOperatorLoading,
} = useMessenger();

const { t } = useI18n();

const targetMessageId = computed(() => props.param || null);
const bladeTitle = computed(() => t("MESSENGER.TITLE"));
const { openBlade, resolveBladeByName } = useBladeNavigation();

const currentSeller = inject("currentSeller") as Ref<{ id: string; name: string }>;
const conversation = ref<Conversation>();

provide("entityId", props.options?.entityId || null);
provide("entityType", props.options?.entityType || null);
provide("sellerId", currentSeller.value.id);
provide("sellerName", currentSeller.value.name);
provide("updateMessage", updateMessage);
provide("removeMessage", removeMessage);
provide("seller", seller);
provide("conversation", conversation);
provide("settings", settings);

const isProgrammaticScroll = ref(false);
provide("isProgrammaticScroll", isProgrammaticScroll);

const initLoading = ref(false);

const activeForm = ref<{ type: "main" | "reply" | "edit" | null; id: string | null }>({
  type: null,
  id: null,
});

const setActiveForm = (formType: "main" | "reply" | "edit" | null, formId: string | null) => {
  activeForm.value.type = formType;
  activeForm.value.id = formId;
};

provide("activeForm", activeForm);
provide("setActiveForm", setActiveForm);

const threadsInner = ref<HTMLElement | null>(null);

const isLoading = useLoading(searchMessagesLoading, getSettingsLoading, getOperatorLoading, initLoading);

const rootMessages = computed(() => {
  if (messages.value?.length) {
    return getRootMessages();
  }
  return [];
});

const updateParent = async () => {
  await searchRootMessages();
};

const sendRootMessage = async (args: {
  content: string;
  replyTo: string | undefined;
  entityId: string;
  entityType: string;
  attachments: MessageAttachment[];
}) => {
  const newMessage = await sendMessage({
    ...args,
    sellerId: currentSeller.value.id,
    sellerName: currentSeller.value.name,
    conversationId: conversation.value?.id,
    rootsOnly: true,
  });

  // After sending a message, scroll to it
  if (newMessage) {
    nextTick(() => {
      const messageElement = threadsInner.value?.querySelector(`[data-message-id="${newMessage.id}"]`);
      if (messageElement) {
        isProgrammaticScroll.value = true;
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });

        setTimeout(() => {
          isProgrammaticScroll.value = false;
        }, 1000);
      }
    });
  }
};

const expandMainForm = () => {
  activeForm.value.type = "main";
};

const updateParentMessage = async (message: Message) => {
  messages.value = messages.value?.map((m) => (m.id === message.id ? message : m));
};

const removeParentMessage = async (message: Message) => {
  messages.value = messages.value?.filter((m) => m.id !== message.id);
};

const updateParentThreadMessage = async (message: Message) => {
  loadedThread.value = loadedThread.value?.map((m) => (m.id === message.id ? message : m));
};

const removeParentThreadMessage = async (message: Message) => {
  loadedThread.value = loadedThread.value?.filter((m) => m.id !== message.id);
};

const markMessageAsRead = (args: { messageId: string; recipientId: string }) => {
  messages.value = messages.value?.map((m) =>
    m.id === args.messageId
      ? new Message({
          ...m,
          recipients: m.recipients?.map((r) =>
            r.recipientId === args.recipientId
              ? new MessageRecipient({ ...r, readStatus: "Read", readTimestamp: new Date() })
              : r,
          ),
        })
      : m,
  );
};

const markThreadMessageAsRead = (args: { messageId: string; recipientId: string }) => {
  loadedThread.value = loadedThread.value?.map((m) =>
    m.id === args.messageId
      ? new Message({
          ...m,
          recipients: m.recipients?.map((r) =>
            r.recipientId === args.recipientId
              ? new MessageRecipient({ ...r, readStatus: "Read", readTimestamp: new Date() })
              : r,
          ),
        })
      : m,
  );
};

const previousLoader = ref<HTMLElement | null>(null);
const nextLoader = ref<HTMLElement | null>(null);

const { previousLoading, nextLoading } = useInfiniteScroll({
  containerRef: threadsInner,
  previousLoader: previousLoader,
  nextLoader: nextLoader,
  onPreviousIntersection: () => loadPreviousMessages(),
  onNextIntersection: () => loadMoreMessages({ ...searchQuery.value }),
  isProgrammaticScroll,
  hasOlderItems: hasOlderMessages,
  hasNewerItems: hasNewerMessages,
  isLoading: searchMessagesLoading,
});

async function searchRootMessages() {
  await searchMessages({
    entityId: props.options?.entityId,
    entityType: props.options?.entityType,
    rootsOnly: true,
    responseGroup: "Full",
    conversationId: conversation.value?.id,
  });
}

async function initialize() {
  try {
    initLoading.value = true;
  if (props.options?.conversation) {
    conversation.value = props.options.conversation;
  } else if (props.options?.entityId && props.options?.entityType) {
    conversation.value = await getConversation(props.options.entityId, props.options.entityType);
  }

  await getOperator();
  if (props.options?.entityId && props.options?.entityType) {
    await getSeller({
      entityId: props.options?.entityId,
      entityType: props.options?.entityType,
    });
  }
  await getSettings();

  if (props.param) {
    await getThread(props.param);
    return;
    }
    await searchRootMessages();
  } catch (error) {
    console.error("Error initializing messenger:", error);
  } finally {
    initLoading.value = false;
  }
}

onMounted(async () => {
  await initialize();
});

const expandAllReplies = async () => {
  await searchMessages({
    entityId: props.options?.entityId,
    entityType: props.options?.entityType,
    responseGroup: "Full",
    conversationId: conversation.value?.id,
  });
};

function goToEntity() {
  if (props.options?.entityId && props.options?.entityType) {
    openBlade({
      blade: { name: EntityToBlade[props.options.entityType as keyof typeof EntityToBlade] },
      param: props.options.entityId,
    });
  }
};

defineExpose({
  title: bladeTitle,
});

</script>

<style lang="scss">
:root {
  --empty-communication: var(--empty-grid-icon-color, var(--secondary-500));
}

.messenger {
  @apply tw-w-full;
  @apply tw-flex tw-flex-col tw-h-full;

  .vc-blade__content {
    @apply tw-p-0;
  }

  &--mobile {
    .messenger__threads-container {
      @apply tw-p-2;
    }
    .messenger__form-container {
      @apply tw-px-2;
    }
  }

  &__content {
    @apply tw-flex tw-flex-col tw-h-full;
    @apply tw-overflow-y-auto;
    @apply tw-bg-[color:var(--additional-50)];
  }

  &__threads-container {
    @apply tw-flex-1;
    @apply tw-p-6;
    @apply tw-overflow-y-auto;
    @apply tw-flex tw-flex-col tw-gap-3;
  }

  &__form-container {
    @apply tw-p-6 tw-pt-3;
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-border-t tw-border-solid tw-border-[color:var(--blade-border-color)];
  }

  &__new-message-form {
    @apply tw-w-full;
  }

  &__skeleton {
    @apply tw-mb-4;
  }

  &__header {
    @apply tw-sticky tw-top-0 tw-z-10;
    @apply tw-p-4;
    @apply tw-bg-[color:var(--blade-background-color)];
    @apply tw-shadow-sm;
  }

  &__header-content {
    @apply tw-flex tw-items-center tw-gap-2;
  }
}
</style>
