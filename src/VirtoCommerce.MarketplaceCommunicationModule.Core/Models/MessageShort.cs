namespace VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
public class MessageShort
{
    public string SenderId { get; set; }
    public string RecipientId { get; set; }
    public string ProductId { get; set; }
    public string Content { get; set; }
    public string ReplyTo { get; set; }

}
