import * as components from "./components";
import * as pages from "./pages";
import * as notifications from "./components/notifications";
import { createAppModule, registerExternalWidget, IBladeInstance } from "@vc-shell/framework";
import * as locales from "./locales";
import { Router } from "vue-router";
import { App, markRaw } from "vue";
import { MessageWidget } from "./components/widgets";

// Declare globally
declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    Messenger: (typeof pages)["Messenger"];
  }
}

export default (() => {
  registerExternalWidget({
    id: "MessageWidget",
    component: markRaw(MessageWidget),
    targetBlades: ["ProductDetails", "Offer", "OrderDetails"],
    config: {
      requiredData: ["id", "objectType"],
    },
    isVisible: (bladeInstance?: IBladeInstance) => {
      return !!bladeInstance?.param;
    },
    updateFunctionName: "updateActiveWidgetCount",
  });
  const module = createAppModule(pages, locales, notifications, components);

  return {
    install(app: App, options: { router: Router }): void {
      module.install(app, options);
    },
  };
})();

export * from "./components";
export * from "./composables";
