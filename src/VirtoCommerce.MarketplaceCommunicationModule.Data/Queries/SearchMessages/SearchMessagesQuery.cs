using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchMessagesQuery : SearchMessageCriteria, IQuery<SearchMessageResult>
{
    public string EntityId { get; set; }

    public string EntityType { get; set; }
}
