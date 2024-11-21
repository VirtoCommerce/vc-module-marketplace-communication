using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetConversationQuery : IQuery<Conversation>
{
    public string ConversationId { get; set; }
    public string EntityId { get; set; }
    public string EntityType { get; set; }
}
