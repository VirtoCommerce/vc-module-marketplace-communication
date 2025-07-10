import {
  VcmpConversationClient,
  Conversation,
  CreateConversationCommand,
} from "@vcmp-communication/api/marketplacecommunication";
import { useApiClient } from "@vc-shell/framework";

export function useConversationApi() {
  const { getApiClient: getConversationClient } = useApiClient(VcmpConversationClient);

  async function createConversation(args: {
    sellerId: string;
    sellerName: string;
    userIds: string[];
    iconUrl?: string;
    entityId?: string;
    entityType?: string;
  }): Promise<Conversation> {
    const client = await getConversationClient();
    const command = new CreateConversationCommand(args);
    return await client.createConversation(command);
  }

  async function getConversation(entityId: string, entityType: string): Promise<Conversation> {
    const client = await getConversationClient();
    return await client.getByEntity(entityId, entityType);
  }

  return {
    createConversation,
    getConversation,
  };
}
