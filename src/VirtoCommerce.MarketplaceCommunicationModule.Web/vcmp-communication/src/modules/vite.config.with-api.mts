import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { getDynamicModuleConfiguration } from "@vc-shell/config-generator";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default getDynamicModuleConfiguration({
  build: {
    manifest: "manifest.json",
    copyPublicDir: false,
    sourcemap: true,
    minify: false,
    lib: {
      entry: resolve(__dirname, "./index.ts"),
    },
  },
  compatibility: {
    framework: "^1.1.56",
  },
});
