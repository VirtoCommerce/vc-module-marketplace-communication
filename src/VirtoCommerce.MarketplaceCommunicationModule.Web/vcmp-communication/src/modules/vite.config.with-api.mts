import { getDynamicModuleConfiguration } from "@vc-shell/mf-module";

export default getDynamicModuleConfiguration({
  entry: "./src/modules/index.ts",
  compatibility: { framework: "^2.0.0" },
});
