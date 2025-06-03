import { ControlSchema, OverridesSchema } from "@vc-shell/framework";

export const overrides: OverridesSchema = {
  upsert: [
    {
      id: "Product",
      path: "content.productWidgets.children",
      index: 4,
      value: { id: "MessageWidget", visibility: { method: "commonWidgetVisibility" } } as unknown as ControlSchema,
    },
    {
      id: "OrderDetails",
      path: "content.orderWidgets.children",
      index: 1,
      value: { id: "MessageWidget", visibility: { method: "commonWidgetVisibility" } } as unknown as ControlSchema,
    },
    {
      id: "Offer",
      path: "content.offerWidgets.children",
      index: 1,
      value: { id: "MessageWidget", visibility: { method: "commonWidgetVisibility" } } as unknown as ControlSchema,
    },
  ],
};
