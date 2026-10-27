using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Moq;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetUnreadCount;
using VirtoCommerce.MarketplaceVendorModule.Core;
using Xunit;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Tests;

[Trait("Category", "Unit")]
public class GetUnreadCountQueryHandlerTests
{
    private const string OperatorGroupId = "OperatorGroupId";
    private const string SellerId = "SellerId";
    private const string EntityId = "OfferId";
    private const string EntityType = "VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer";
    private const string ConversationId = "ConversationId";

    // Unread messages of each communication user in the entity's conversation
    private const int OperatorGroupUnreadCount = 3;
    private const int SellerUnreadCount = 5;

    // An operator (or admin) in the Vendor Portal with no vendor picked sends no SellerId:
    // the count is the operator group's, the communication user the operator reads and answers as
    [Fact]
    public async Task Handle_OperatorWithoutSeller_CountsOperatorGroupMessages()
    {
        // Arrange
        var handler = CreateHandler();
        var query = CreateQuery(isOperator: true, sellerId: null);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(OperatorGroupUnreadCount, result);
    }

    // A seller user always gets its own SellerId from the authorization handler, and an operator who picked
    // a vendor sends that vendor's id: both keep counting the seller's messages
    [Theory]
    [InlineData(false)]
    [InlineData(true)]
    public async Task Handle_WithSeller_CountsSellerMessages(bool isOperator)
    {
        // Arrange
        var handler = CreateHandler();
        var query = CreateQuery(isOperator, SellerId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Equal(SellerUnreadCount, result);
    }

    private static GetUnreadCountQuery CreateQuery(bool isOperator, string sellerId)
    {
        return new GetUnreadCountQuery
        {
            IsOperator = isOperator,
            SellerId = sellerId,
            EntityId = EntityId,
            EntityType = EntityType,
        };
    }

    private static GetUnreadCountQueryHandler CreateHandler()
    {
        var communicationUserService = new Mock<ICommunicationUserService>();
        communicationUserService
            .Setup(x => x.GetOrCreateCommunicationUser(It.IsAny<string>(), CoreModuleConstants.CommunicationUserType.Organization))
            .ReturnsAsync((string userId, string userType) => new CommunicationUser { Id = GetCommunicationUserId(userId), UserId = userId, UserType = userType });

        var conversationService = new Mock<IConversationService>();
        conversationService
            .Setup(x => x.GetConversationByEntity(EntityId, EntityType))
            .ReturnsAsync(new Conversation { Id = ConversationId });

        var messageService = new Mock<IMessageService>();
        messageService
            .Setup(x => x.GetUnreadMessagesCount(GetCommunicationUserId(OperatorGroupId), ConversationId))
            .ReturnsAsync(OperatorGroupUnreadCount);
        messageService
            .Setup(x => x.GetUnreadMessagesCount(GetCommunicationUserId(SellerId), ConversationId))
            .ReturnsAsync(SellerUnreadCount);

        var options = Options.Create(new MarketplaceOptions { OperatorGroupId = OperatorGroupId });

        return new GetUnreadCountQueryHandler(messageService.Object, communicationUserService.Object, conversationService.Object, options);
    }

    private static string GetCommunicationUserId(string userId)
    {
        return $"{userId}-CommunicationUser";
    }
}
