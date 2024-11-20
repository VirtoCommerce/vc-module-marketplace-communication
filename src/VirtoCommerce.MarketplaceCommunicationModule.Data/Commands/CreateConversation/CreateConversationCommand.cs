using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Core.Domains;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class CreateConversationCommand : ICommand<Conversation>, IHasSellerId
{
    public string SellerId { get; set; }
    public string SellerName { get; set; }

    [Required]
    public string[] UserIds;

    public string Name;
    public string IconUrl;
    public string EntityId;
    public string EntityType;
}
