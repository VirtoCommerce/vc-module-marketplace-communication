import {
  VcmpCommunicationUserClient,
  CommunicationUser,
  GetSellerCommunicationUserQuery,
  IGetSellerCommunicationUserQuery,
} from "@vcmp-communication/api/marketplacecommunication";
import { useApiClient } from "@vc-shell/framework";

export function useUserApi() {
  const { getApiClient: getCommunicationUserClient } = useApiClient(VcmpCommunicationUserClient);

  async function getOperator(): Promise<CommunicationUser> {
    const client = await getCommunicationUserClient();
    return await client.getOperator();
  }

  async function getSeller(query: IGetSellerCommunicationUserQuery): Promise<CommunicationUser> {
    const client = await getCommunicationUserClient();
    return await client.getSeller(new GetSellerCommunicationUserQuery(query));
  }

  async function getUsers(ids: string[] | undefined): Promise<CommunicationUser[]> {
    if (!ids || !ids.length) {
      return [];
    }
    const client = await getCommunicationUserClient();
    return await client.getCommunicationUsers(ids);
  }

  async function getUser(id: string): Promise<CommunicationUser | undefined> {
    const users = await getUsers([id]);
    return users[0];
  }

  return {
    getOperator,
    getSeller,
    getUsers,
    getUser,
  };
}
