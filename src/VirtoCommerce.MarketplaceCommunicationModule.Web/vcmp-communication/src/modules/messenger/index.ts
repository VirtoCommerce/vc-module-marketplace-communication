import * as components from "./components";
import * as pages from "./pages";
import * as notifications from "./components/notifications";
import { createAppModule, registerExternalWidget, IBladeInstance } from "@vc-shell/framework";
import * as locales from "./locales";
import { App, markRaw } from "vue";
import { MessageWidget } from "./components/widgets";

export default (() => {
  registerExternalWidget({
    id: "MessageWidget",
    component: markRaw(MessageWidget),
    targetBlades: ["ProductDetails", "Offer", "OrderDetails"],
    isVisible: (bladeInstance?: IBladeInstance) => {
      return !!bladeInstance?.param;
    },
  });
  const module = createAppModule(pages, locales, notifications);

  return {
    install(app: App): void {
      module.install(app);
    },
  };
})();

export * from "./components";
export * from "./composables";
