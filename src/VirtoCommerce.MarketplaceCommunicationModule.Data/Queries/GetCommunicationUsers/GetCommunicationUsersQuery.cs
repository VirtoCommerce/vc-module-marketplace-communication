using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetCommunicationUsersQuery : IQuery<CommunicationUser[]>
{
    [Required]
    public string[] CommunicationUserIds { get; set; }
}
