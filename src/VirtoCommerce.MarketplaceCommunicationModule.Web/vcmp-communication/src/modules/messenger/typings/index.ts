import { PushNotification } from "@vc-shell/framework";

export enum ConversationListType {
  "VirtoCommerce.OrdersModule.Core.Model.CustomerOrder" = "Order",
  "VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct" = "ProductDetails",
  "VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer" = "Offer",
}

export enum EntityToBlade {
  "VirtoCommerce.OrdersModule.Core.Model.CustomerOrder" = "OrderDetails",
  "VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct" = "ProductDetails",
  "VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer" = "Offer",
}

export interface MessagePushNotification extends PushNotification {
  content?: string;
  notifyType?: "MessagePushNotification";
  senderId?: string;
  messageId?: string;
  entityType?: string;
  entityId?: string;
  conversationId?: string;
}
