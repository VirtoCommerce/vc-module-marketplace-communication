using System.ComponentModel.DataAnnotations;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class UpdateConversationCommand : ICommand<Conversation>
{
    [Required]
    public Conversation Conversation { get; set; }
}
