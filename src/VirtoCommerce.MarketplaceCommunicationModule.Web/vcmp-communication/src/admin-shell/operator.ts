import type { CommunicationUser } from "@vcmp-communication/api/marketplacecommunication";
import { useUserApi } from "../modules/messenger/composables/useUserApi";

// The operator's communication user is the same for every widget on the page: load it once,
// and forget a failed load so the next widget retries.
let operatorPromise: Promise<CommunicationUser> | undefined;

export function useOperator() {
  const { getOperator } = useUserApi();

  function loadOperator(): Promise<CommunicationUser> {
    operatorPromise ??= getOperator().catch((error) => {
      operatorPromise = undefined;
      throw error;
    });
    return operatorPromise;
  }

  return { loadOperator };
}
