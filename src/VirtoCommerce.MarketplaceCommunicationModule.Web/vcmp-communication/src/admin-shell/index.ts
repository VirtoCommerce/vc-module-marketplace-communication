// Admin Shell plugin: the operator's side of the marketplace messenger. The blades and components are the
// vendor portal's (src/modules/messenger); this entry swaps the writing side to the operator and puts the
// widgets on the marketplace blades instead of the vendor portal's.
import { computed, defineComponent, h, inject, markRaw, type App, type Component } from "vue";
import {
  defineAppModule,
  NotificationStoreKey,
  registerExternalWidget,
  useNotificationStore,
} from "@vc-shell/framework";
import { AllMessages, Messenger } from "../modules/messenger/pages";
import MessagePushNotification from "../modules/messenger/notifications/MessagePushNotification.vue";
import { messengerIdentityKey, type MessengerIdentity } from "../modules/messenger/identity";
import EntityCommunicationWidget from "./widgets/entity-communication-widget.vue";
import SellerCommunicationWidget from "./widgets/seller-communication-widget.vue";
import { ENTITY_TYPES, HOST_BLADES } from "./constants";
import { isOpenedFrom, setHostApp } from "./blade-stack";
import { useOperator } from "./operator";
import * as locales from "./locales";

import "./styles.scss";

const operatorIdentity: MessengerIdentity = {
  role: "operator",
  seller: computed(() => undefined),
  entityBlades: {
    [ENTITY_TYPES.PRODUCT]: HOST_BLADES.PRODUCT,
    [ENTITY_TYPES.OFFER]: HOST_BLADES.OFFER,
    [ENTITY_TYPES.ORDER]: HOST_BLADES.ORDER,
  },
};

// external widgets take no props: bind the entity type into a wrapper
function entityWidget(entityType: string): Component {
  return markRaw(
    defineComponent({
      name: "EntityCommunicationWidget",
      setup: () => () => h(EntityCommunicationWidget, { entityType }),
    }),
  );
}

// legacy seller-communication-widget on "sellerDetails"
registerExternalWidget({
  id: "MarketplaceSellerCommunication",
  title: "Communication",
  component: markRaw(SellerCommunicationWidget),
  targetBlades: [HOST_BLADES.SELLER],
  isVisible: (blade) => !!blade?.param,
});

// legacy product-communication-widget on "sellerProductDetailsWidgetContainer"
registerExternalWidget({
  id: "MarketplaceProductCommunication",
  title: "Communication",
  component: entityWidget(ENTITY_TYPES.PRODUCT),
  targetBlades: [HOST_BLADES.PRODUCT],
  isVisible: (blade) => !!blade?.param,
});

// legacy offer-communication-widget on "offerDetailsWidgetContainer"
registerExternalWidget({
  id: "MarketplaceOfferCommunication",
  title: "Communication",
  component: entityWidget(ENTITY_TYPES.OFFER),
  targetBlades: [HOST_BLADES.OFFER],
  isVisible: (blade) => !!blade?.param,
});

// legacy order-communication-widget sat on every order ("customerOrderDetailWidgets"). Orders' blade is shared
// with the regular Orders screen, so only orders opened from Operator orders get it: the order itself and the
// seller orders opened from its "Seller orders" widget.
registerExternalWidget({
  id: "MarketplaceOrderCommunication",
  title: "Communication",
  component: entityWidget(ENTITY_TYPES.ORDER),
  targetBlades: [HOST_BLADES.ORDER],
  isVisible: (blade) => !!blade?.param && isOpenedFrom(blade, [HOST_BLADES.OPERATOR_ORDERS]),
});

const module = defineAppModule({
  blades: { AllMessages, Messenger },
  locales,
  notifications: {
    // legacy pushNotificationTemplateResolver for MessagePushNotification
    MessagePushNotification: {
      template: markRaw(MessagePushNotification),
      toast: { mode: "auto" },
    },
  },
});

// The platform also broadcasts every push notification to all clients (SendSystemEvents), so without a filter
// the operator gets a toast for every message anyone sends, its own included. Messages to the operator group
// also arrive directly (Send) and pass no filter; drop the broadcast copies addressed to anyone else.
// The broadcast filter is one slot for the whole host: let every other notification type through.
function filterMessageBroadcasts(app: App): void {
  const store = app.runWithContext(() => inject(NotificationStoreKey, null)) ?? useNotificationStore();
  const { loadOperator } = app.runWithContext(() => useOperator());
  let operatorGroupId: string | undefined;

  store.setBroadcastFilter((msg) => {
    if (msg.notifyType !== "MessagePushNotification") return true;
    if (!operatorGroupId) {
      // the plugin may install before sign-in: load on demand, a failed load retries on the next message
      loadOperator()
        .then((operator) => (operatorGroupId = operator.userId))
        .catch(() => undefined);
      return false;
    }
    return msg.creator === operatorGroupId;
  });
}

export default {
  install(app: App): void {
    setHostApp(app);
    app.provide(messengerIdentityKey, operatorIdentity);
    module.install(app);
    filterMessageBroadcasts(app);
  },
};
