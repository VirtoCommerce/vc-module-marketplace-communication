import { useApiClient } from "@vc-shell/framework";
import {
  SearchMessagesQuery,
  VcmpMessageClient,
  Message,
  SendMessageCommand,
  MessageShort,
  UpdateMessageCommand,
  DeleteMessageCommand,
  MarkMessageAsReadCommand,
  GetUnreadCountQuery,
  SearchMessageResult,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";

export function useMessageApi() {
  const { getApiClient: getMessagingClient } = useApiClient(VcmpMessageClient);

  async function searchMessages(query: SearchMessagesQuery): Promise<SearchMessageResult> {
    const client = await getMessagingClient();
    return await client.search({
      ...query,
    } as SearchMessagesQuery);
  }

  async function sendMessage(message: {
    content: string;
    replyTo: string | undefined;
    sellerId: string;
    sellerName: string;
    entityId: string;
    entityType: string;
    conversationId?: string;
    attachments?: MessageAttachment[];
    recipientId?: string;
  }): Promise<void> {
    const client = await getMessagingClient();
    const command = {
      sellerId: message.sellerId,
      sellerName: message.sellerName,
      message: {
        content: message.content,
        replyTo: message.replyTo,
        entityId: message.entityId,
        entityType: message.entityType,
        senderId: undefined, // this is set on the backend
        conversationId: message.conversationId,
        recipientId: message.recipientId,
        attachments: message.attachments,
      } as MessageShort,
    } as SendMessageCommand;
    await client.sendMessage(command);
  }

  async function updateMessage(message: UpdateMessageCommand): Promise<void> {
    const command = {
      ...message,
    } as UpdateMessageCommand;
    const client = await getMessagingClient();
    await client.updateMessage(command);
  }

  async function removeMessage(args: DeleteMessageCommand): Promise<void> {
    const command = {
      ...args,
    } as DeleteMessageCommand;
    const client = await getMessagingClient();
    await client.deleteMessage(command);
  }

  async function markMessageAsRead(args: MarkMessageAsReadCommand): Promise<void> {
    const client = await getMessagingClient();
    await client.markMessageAsRead({
      ...args,
    } as MarkMessageAsReadCommand);
  }

  async function getUnreadCount(query: GetUnreadCountQuery): Promise<number> {
    const client = await getMessagingClient();
    const result = await client.getUnreadMessageCount({
      ...query,
    } as GetUnreadCountQuery);
    return result || 0;
  }

  async function getThread(id: string | undefined): Promise<Message[]> {
    const client = await getMessagingClient();
    return await client.getThread(id);
  }

  return {
    searchMessages,
    sendMessage,
    updateMessage,
    removeMessage,
    markMessageAsRead,
    getUnreadCount,
    getThread,
  };
}
