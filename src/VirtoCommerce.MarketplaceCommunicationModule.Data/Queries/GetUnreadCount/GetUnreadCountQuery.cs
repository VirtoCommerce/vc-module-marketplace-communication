using System.ComponentModel.DataAnnotations;
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

    [Required]
    public string EntityId { get; set; }

    [Required]
    public string EntityType { get; set; }
}
