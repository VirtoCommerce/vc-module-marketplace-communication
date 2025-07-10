import { VcmpCommunicationClient, MarketplaceCommunicationSettings } from "@vcmp-communication/api/marketplacecommunication";
import { useApiClient } from "@vc-shell/framework";

export function useSettingsApi() {
  const { getApiClient: getCommunicationSettingsClient } = useApiClient(VcmpCommunicationClient);

  async function getSettings(): Promise<MarketplaceCommunicationSettings> {
    const client = await getCommunicationSettingsClient();
    return await client.getCommunicationSettings();
  }

  return {
    getSettings,
  };
}
