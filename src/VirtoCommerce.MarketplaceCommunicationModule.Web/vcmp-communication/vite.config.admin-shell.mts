import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDynamicModuleConfiguration } from "@vc-shell/mf-module";

// Builds the operator's messenger as a Module Federation remote of the Admin Shell host, from the same sources
// as the vendor portal remote (src/modules/vite.config.with-api.mts); src/admin-shell/index.ts is the entry.
// Output: <module>/plugins/admin-shell/ (remoteEntry.js + plugin.json with the menu contribution),
// served by the platform at /modules/$(VirtoCommerce.MarketplaceCommunication)/plugins/admin-shell/.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = "/modules/$(VirtoCommerce.MarketplaceCommunication)/plugins/admin-shell/";
process.env.APP_BASE_PATH = base;

export default getDynamicModuleConfiguration({
  appId: "admin-shell",
  moduleRoot: path.resolve(__dirname, ".."),
  entry: "./src/admin-shell/index.ts",
  remoteName: "marketplace_communication_admin",
  base,
  // plugin.json only; public/ holds the standalone app's images
  publicDir: path.resolve(__dirname, "src/admin-shell/public"),
  build: {
    // the standalone app's index.html would bundle the whole vendor app
    rollupOptions: { input: path.resolve(__dirname, "admin-shell.html") },
  },
});
