import * as components from "./components";
import * as pages from "./pages";
import * as notifications from "./components/notifications";
import { createDynamicAppModule, createAppModule, registerExternalWidget, IBladeInstance } from "@vc-shell/framework";
import { overrides } from "./pages/overrides";
import * as locales from "./locales";
import { Router } from "vue-router";
import { App, markRaw } from "vue";
import MessageWidgetNew from "./components/widgets/message-widgetNew.vue";

// Declare globally
declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    Messenger: (typeof pages)["Messenger"];
  }
}

export default (() => {
  registerExternalWidget({
    id: "MessageWidget",
    component: markRaw(MessageWidgetNew),
    targetBlades: ["ProductDetails"],
    config: {
      requiredData: ["id", "objectType"],
    },
    isVisible: (bladeInstance?: IBladeInstance) => {
      return !!bladeInstance?.param;
    },
    updateFunctionName: "updateActiveWidgetCount",
  });

  const dynamic = createDynamicAppModule({
    overrides,
    locales,
    moduleComponents: components,
    notificationTemplates: notifications,
  });

  const module = createAppModule(pages, locales, notifications, components);

  return {
    install(app: App, options: { router: Router }): void {
      dynamic.install(app, options);
      module.install(app, options);
    },
  };
})();

export * from "./components";
export * from "./composables";
