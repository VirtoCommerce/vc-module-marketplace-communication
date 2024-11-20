using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetConversationQuery : IQuery<Conversation>
{
    [Required]
    public string EntityId { get; set; }

    [Required]
    public string EntityType { get; set; }
}
