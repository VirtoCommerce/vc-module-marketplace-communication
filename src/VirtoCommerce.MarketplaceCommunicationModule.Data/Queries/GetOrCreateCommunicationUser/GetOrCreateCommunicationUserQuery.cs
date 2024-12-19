using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetOrCreateCommunicationUserQuery : IQuery<CommunicationUser>
{
    [Required]
    public string UserId { get; set; }

    [Required]
    public string UserType { get; set; }
}
