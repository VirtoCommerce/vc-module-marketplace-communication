using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetThread;
public class GetThreadQuery : IQuery<IList<Message>>
{
    [Required]
    public string ThreadId { get; set; }
}
