using System.ComponentModel.DataAnnotations;
using VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class SendMessageCommand : ICommand, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    [Required]
    public MessageShort Message { get; set; }
}
