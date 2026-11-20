// The backend's ModuleConstants (Security.Permissions, EntityType)
export const PERMISSIONS = {
  READ: "seller:message:read",
} as const;

export const ENTITY_TYPES = {
  PRODUCT: "VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct",
  OFFER: "VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer",
  ORDER: "VirtoCommerce.OrdersModule.Core.Model.CustomerOrder",
} as const;

// Blades of the marketplace vendor plugin and the Orders plugin the widgets sit on and the messenger links to
export const HOST_BLADES = {
  SELLER: "MarketplaceSellerDetails",
  PRODUCT: "MarketplaceSellerProductDetails",
  OFFER: "MarketplaceOfferDetails",
  ORDER: "OrdersDetails",
  OPERATOR_ORDERS: "MarketplaceOperatorOrders",
} as const;
