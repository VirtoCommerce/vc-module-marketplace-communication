using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerAggregate;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetUnreadCount;
public class GetUnreadCountQuery : IQuery<int>, IHasSellerId, IHasOperatorId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    public bool IsOperator { get; set; }
    public string OperatorId { get; set; }
    public string OperatorName { get; set; }

    public string RecipientId { get; set; }

    /// <summary>
    /// The entity whose conversation is counted. Without an entity, the direct conversation
    /// between the recipient and the seller (SellerId) is counted.
    /// </summary>
    public string EntityId { get; set; }

    public string EntityType { get; set; }
}
