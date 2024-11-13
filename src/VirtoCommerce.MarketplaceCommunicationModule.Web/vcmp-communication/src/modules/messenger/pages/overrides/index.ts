import { OverridesSchema } from "@vc-shell/framework";

export const overrides: OverridesSchema = {
  upsert: [
    {
      id: "Product",
      path: "content.productWidgets.children",
      index: 4,
      value: "MessageWidget",
    },
    {
      id: "OrderDetails",
      path: "content.orderWidgets.children",
      index: 1,
      value: "MessageWidget",
    },
    {
      id: "Offer",
      path: "content.offerWidgets.children",
      index: 1,
      value: "MessageWidget",
    },
  ],
};
