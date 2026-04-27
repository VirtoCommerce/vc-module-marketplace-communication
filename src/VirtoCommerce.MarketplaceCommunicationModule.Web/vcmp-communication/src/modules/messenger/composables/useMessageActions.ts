import { inject } from "vue";
import { useAsync } from "@vc-shell/framework";
import {
  MessageAttachment,
  UpdateMessageCommand,
  DeleteMessageCommand,
  MarkMessageAsReadCommand,
} from "@vcmp-communication/api/marketplacecommunication";
import { useMessageApi } from "./useMessageApi";
import { messengerContextKey, messengerStoreKey } from "../injection-keys";

export function useMessageActions() {
  const store = inject(messengerStoreKey)!;
  const ctx = inject(messengerContextKey)!;
  const {
    sendMessage: sendMessageApi,
    updateMessage: updateMessageApi,
    removeMessage: removeMessageApi,
    markMessageAsRead: markMessageAsReadApi,
  } = useMessageApi();

  const { action: send, loading: sendLoading } = useAsync<{
    content: string;
    replyTo: string | undefined;
    threadId?: string;
    conversationId?: string;
    attachments?: MessageAttachment[];
  }>(async (args) => {
    if (!args) return;
    store.sendMessageLoading.value = true;
    try {
      await sendMessageApi({
        ...args,
        sellerId: ctx.sellerId,
        sellerName: ctx.sellerName,
        entityId: ctx.entityId!,
        entityType: ctx.entityType!,
        recipientId: store.operator.value?.id,
        conversationId: args.conversationId || ctx.conversation.value?.id,
      });
      // Re-fetch — API does not return full Message with sender info
      await store.loadMessages({
        ...store.searchQuery.value,
        conversationId: args.conversationId || ctx.conversation.value?.id,
      });
    } finally {
      store.sendMessageLoading.value = false;
    }
  });

  async function update(args: UpdateMessageCommand) {
    await updateMessageApi({
      ...args,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
    } as UpdateMessageCommand);
  }

  async function remove(messageIds: string[], withReplies: boolean) {
    await removeMessageApi({
      ...({
        messageIds,
        sellerId: ctx.sellerId,
        sellerName: ctx.sellerName,
      } as any),
    } as DeleteMessageCommand);
    store.removeMessageFromList(messageIds);
  }

  async function markAsRead(messageId: string, recipientId: string) {
    await markMessageAsReadApi({
      messageId,
      recipientId,
      sellerId: ctx.sellerId,
      sellerName: ctx.sellerName,
    } as MarkMessageAsReadCommand);
  }

  return { send, sendLoading, update, remove, markAsRead };
}
