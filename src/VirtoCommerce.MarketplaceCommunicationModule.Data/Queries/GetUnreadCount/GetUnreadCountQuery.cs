using System.ComponentModel.DataAnnotations;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetUnreadCount;
public class GetUnreadCountQuery : IQuery<int>, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    public string RecipientId { get; set; }

    [Required]
    public string EntityId { get; set; }

    [Required]
    public string EntityType { get; set; }
}
