import { computed, inject, type ComputedRef, type InjectionKey } from "vue";
import { EntityToBlade } from "./typings";

// Who writes from this UI. The same blades serve the vendor portal (the seller talks to the
// marketplace) and the Admin Shell (the operator talks to sellers); only the sides swap.
export type MessengerRole = "seller" | "operator";

export type MessengerIdentity = {
  role: MessengerRole;
  // the seller the vendor portal works for; undefined for the operator
  seller: ComputedRef<{ id: string; name: string } | undefined>;
  // entity type -> blade that shows the entity in the hosting app
  entityBlades: Partial<Record<string, string>>;
};

export const messengerIdentityKey: InjectionKey<MessengerIdentity> = Symbol("messengerIdentity");

const vendorEntityBlades: Partial<Record<string, string>> = { ...EntityToBlade };

/**
 * The identity provided by the hosting app. Without one, it is the vendor portal: the seller
 * comes from the portal's "currentSeller" (as before the Admin Shell build existed).
 */
export function useMessengerIdentity(): MessengerIdentity {
  const provided = inject(messengerIdentityKey, null);
  if (provided) return provided;

  const currentSeller = inject<ComputedRef<{ id: string; name: string } | undefined> | undefined>(
    "currentSeller",
    undefined,
  );
  return {
    role: "seller",
    seller: computed(() => currentSeller?.value),
    entityBlades: vendorEntityBlades,
  };
}
