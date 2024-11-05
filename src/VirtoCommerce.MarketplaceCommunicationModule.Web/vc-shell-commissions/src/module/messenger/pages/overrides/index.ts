import { OverridesSchema } from "@vc-shell/framework";

export const overrides: OverridesSchema = {
  upsert: [
    {
      id: "Product",
      path: "content.productWidgets.children",
      index: 4,
      value: "MessageWidget",
    },
  ],
};
