using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetSellerCommunicationUser;
public class GetSellerCommunicationUserQuery : IQuery<CommunicationUser>
{
    [Required]
    public string EntityId { get; set; }

    [Required]
    public string EntityType { get; set; }
}
