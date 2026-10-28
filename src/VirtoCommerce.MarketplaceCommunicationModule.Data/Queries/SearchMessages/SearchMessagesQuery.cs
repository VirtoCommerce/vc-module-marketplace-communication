using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchMessagesQuery : SearchMessageCriteria, IQuery<SearchMessageResult>, IHasSellerId
{
    public string EntityId { get; set; }

    public string EntityType { get; set; }

    public string SellerId { get; set; }

    public string SellerName { get; set; }

    /// <summary>
    /// Only messages the seller has not read yet
    /// </summary>
    public bool UnreadOnly { get; set; }
}
