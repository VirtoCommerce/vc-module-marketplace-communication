import * as pages from "./pages";
import { registerExternalWidget, IBladeInstance, defineAppModule } from "@vc-shell/framework";
import * as locales from "./locales";
import { App, markRaw } from "vue";
import { MessageWidget } from "./components/widgets";
import MessagePushNotification from "./notifications/MessagePushNotification.vue";

export default (() => {
  registerExternalWidget({
    id: "MessageWidget",
    component: markRaw(MessageWidget),
    targetBlades: ["ProductDetails", "Offer", "OrderDetails"],
    isVisible: (bladeInstance?: IBladeInstance) => {
      return !!bladeInstance?.param;
    },
  });
  const module = defineAppModule({
    blades: pages,
    locales,
    notifications: {
      MessagePushNotification: {
        template: MessagePushNotification,
        toast: { mode: "auto" },
      },
    },
  });

  return {
    install(app: App): void {
      module.install(app);
    },
  };
})();

export * from "./components";
export * from "./composables";
