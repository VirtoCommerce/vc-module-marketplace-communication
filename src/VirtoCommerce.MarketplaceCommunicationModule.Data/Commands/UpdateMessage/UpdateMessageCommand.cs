using System.ComponentModel.DataAnnotations;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class UpdateMessageCommand : ICommand, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    [Required]
    public string MessageId { get; set; }

    [Required]
    public string Content { get; set; }
}
