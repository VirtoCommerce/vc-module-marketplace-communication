using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetMessageQuery : IQuery<Message>
{
    [Required]
    public string MessageId { get; set; }
}
