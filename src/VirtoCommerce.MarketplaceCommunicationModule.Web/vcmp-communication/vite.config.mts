import { getApplicationConfiguration } from "@vc-shell/config-generator";
import { resolve } from "node:path";

const mode = process.env.APP_ENV as string;

export default getApplicationConfiguration({
  resolve: {
    alias: {
      "@vcmp-communication/api/marketplacecommunication":
        mode === "development"
          ? resolve("src/api_client/virtocommerce.marketplacecommunication.js")
          : "@vcmp-communication/api/marketplacecommunication",
      "vee-validate": resolve(__dirname, "node_modules/vee-validate/dist/vee-validate.mjs"),
    },
  },
});
