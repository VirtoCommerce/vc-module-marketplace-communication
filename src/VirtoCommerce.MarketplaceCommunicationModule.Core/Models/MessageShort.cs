namespace VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
public class MessageShort
{
    public string SenderId { get; set; }
    public string RecipientId { get; set; }
    public string ConversationId { get; set; }
    public string EntityId { get; set; }
    public string EntityType { get; set; }
    public string Content { get; set; }
    public string ReplyTo { get; set; }
}
