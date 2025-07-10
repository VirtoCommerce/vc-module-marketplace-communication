import { useApiClient } from "@vc-shell/framework";
import {
  SearchMessagesQuery,
  VcmpMessageClient,
  Message,
  SendMessageCommand,
  MessageShort,
  UpdateMessageCommand,
  IUpdateMessageCommand,
  DeleteMessageCommand,
  IDeleteMessageCommand,
  ISearchMessagesQuery,
  MarkMessageAsReadCommand,
  IMarkMessageAsReadCommand,
  GetUnreadCountQuery,
  IGetUnreadCountQuery,
  ISearchMessageResult,
  MessageAttachment,
} from "@vcmp-communication/api/marketplacecommunication";

export function useMessageApi() {
  const { getApiClient: getMessagingClient } = useApiClient(VcmpMessageClient);

  async function searchMessages(query: ISearchMessagesQuery): Promise<ISearchMessageResult> {
    const client = await getMessagingClient();
    return await client.search(new SearchMessagesQuery(query));
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
    const command = new SendMessageCommand({
      sellerId: message.sellerId,
      sellerName: message.sellerName,
      message: new MessageShort({
        content: message.content,
        replyTo: message.replyTo,
        entityId: message.entityId,
        entityType: message.entityType,
        senderId: undefined, // this is set on the backend
        conversationId: message.conversationId,
        recipientId: message.recipientId,
        attachments: message.attachments,
      }),
    });
    await client.sendMessage(command);
  }

  async function updateMessage(message: IUpdateMessageCommand): Promise<void> {
    const command = new UpdateMessageCommand(message);
    const client = await getMessagingClient();
    await client.updateMessage(command);
  }

  async function removeMessage(args: IDeleteMessageCommand): Promise<void> {
    const command = new DeleteMessageCommand(args);
    const client = await getMessagingClient();
    await client.deleteMessage(command);
  }

  async function markMessageAsRead(args: IMarkMessageAsReadCommand): Promise<void> {
    const client = await getMessagingClient();
    await client.markMessageAsRead(new MarkMessageAsReadCommand(args));
  }

  async function getUnreadCount(query: IGetUnreadCountQuery): Promise<number> {
    const client = await getMessagingClient();
    const result = await client.getUnreadMessageCount(new GetUnreadCountQuery(query));
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
