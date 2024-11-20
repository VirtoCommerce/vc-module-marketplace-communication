using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchConversationsQuery : SearchConversationCriteria, IQuery<SearchConversationResult>, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }
}
