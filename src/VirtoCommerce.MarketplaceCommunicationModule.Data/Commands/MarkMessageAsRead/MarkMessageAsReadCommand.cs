using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class MarkMessageAsReadCommand : ICommand<Message>, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    [Required]
    public string MessageId { get; set; }

    public bool NotRead { get; set; }
}
