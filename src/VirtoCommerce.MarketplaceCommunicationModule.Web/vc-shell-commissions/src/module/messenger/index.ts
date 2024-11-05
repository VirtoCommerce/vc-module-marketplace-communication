import * as components from "./components";
import * as pages from "./pages";
import * as notifications from "./components/notifications";
import { createDynamicAppModule, createAppModule } from "@vc-shell/framework";
import { overrides } from "./pages/overrides";
import * as locales from "./locales";
import { Router } from "vue-router";
import { App } from "vue";

// Declare globally
declare module "@vue/runtime-core" {
  export interface GlobalComponents {
    Messenger: (typeof pages)["Messenger"];
  }
}

export default (() => {
  const dynamic = createDynamicAppModule({
    overrides,
    locales,
  });

  const module = createAppModule(pages, undefined, notifications, components);

  return {
    install(app: App, options: { router: Router }): void {
      dynamic.install(app, options);
      module.install(app, options);
    },
  };
})();

export * from "./components";
export * from "./composables";
