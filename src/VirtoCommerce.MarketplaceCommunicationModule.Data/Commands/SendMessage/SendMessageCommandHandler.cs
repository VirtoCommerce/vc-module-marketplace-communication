using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Data.Services;
using VirtoCommerce.Platform.Core.Common;
using static VirtoCommerce.MarketplaceCommunicationModule.Core.ModuleConstants;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class SendMessageCommandHandler : ICommandHandler<SendMessageCommand>
{
    private readonly IMessageService _messageService;
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationService _conversationService;
    private readonly ISellerProductCrudService _sellerProductService;
    private readonly IOfferCrudService _offerCrudService;
    private readonly ISellerOrderCrudService _sellerOrderCrudService;

    public SendMessageCommandHandler(
        IMessageService messageService,
        ICommunicationUserService communicationUserService,
        IConversationService conversationService,
        ISellerProductCrudService sellerProductService,
        IOfferCrudService offerCrudService,
        ISellerOrderCrudService sellerOrderCrudService
        )
    {
        _messageService = messageService;
        _communicationUserService = communicationUserService;
        _conversationService = conversationService;
        _sellerProductService = sellerProductService;
        _offerCrudService = offerCrudService;
        _sellerOrderCrudService = sellerOrderCrudService;
    }

    public virtual async Task<Unit> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.Message == null)
        {
            throw new ArgumentNullException(nameof(request.Message));
        }

        var senderId = request.Message.SenderId
            ?? (await _communicationUserService.GetOrCreateCommunicationUser(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization)).Id;

        var conversationId = request.Message.ConversationId;
        if (string.IsNullOrEmpty(conversationId) && !string.IsNullOrEmpty(request.Message.EntityId) && !string.IsNullOrEmpty(request.Message.EntityType))
        {
            conversationId = (await _conversationService.GetConversationByEntity(request.Message.EntityId, request.Message.EntityType))?.Id;
        }

        if (string.IsNullOrEmpty(conversationId) && !string.IsNullOrEmpty(request.Message.EntityId) && !string.IsNullOrEmpty(request.Message.EntityType))
        {
            var userIds = new List<string>
            {
                senderId,
                request.Message.RecipientId
            };

            (string conversationName, string iconUrl) = await GetConversationNameByEntity(request.Message.EntityId, request.Message.EntityType);

            conversationId = (await _conversationService.CreateConversation(userIds, conversationName, iconUrl, request.Message.EntityId, request.Message.EntityType))?.Id;
        }

        if (string.IsNullOrEmpty(conversationId) && string.IsNullOrEmpty(request.Message.EntityId))
        {
            var userIds = new List<string>
            {
                senderId,
                request.Message.RecipientId
            };

            conversationId = (await _conversationService.GetConversationByUsers(userIds))?.Id;
        }

        if (string.IsNullOrEmpty(conversationId))
        {
            throw new ArgumentException(nameof(request.Message.ConversationId));
        }

        var message = AbstractTypeFactory<Message>.TryCreateInstance();
        message.SenderId = senderId;
        message.Content = request.Message.Content;
        message.ConversationId = conversationId;
        message.ThreadId = request.Message.ReplyTo;

        var messageRecipient = AbstractTypeFactory<MessageRecipient>.TryCreateInstance();
        messageRecipient.RecipientId = request.Message.RecipientId;
        messageRecipient.ReadStatus = CoreModuleConstants.ReadStatus.New;
        message.Recipients = new List<MessageRecipient> { messageRecipient };

        await _messageService.SendMessage(message);
        return Unit.Value;
    }

    protected virtual async Task<(string, string)> GetConversationNameByEntity(string entityId, string entityType)
    {
        string conversationName = string.Empty;
        string iconUrl = null;

        switch (entityType)
        {
            case EntityType.Product:
                var product = (await _sellerProductService.GetAsync([entityId])).FirstOrDefault();
                conversationName = product?.Name;
                iconUrl = product?.ImgSrc;
                break;
            case EntityType.Offer:
                var offer = (await _offerCrudService.GetAsync([entityId])).FirstOrDefault();
                conversationName = offer?.Name;
                iconUrl = offer?.ImgSrc;
                break;
            case EntityType.Order:
                var order = (await _sellerOrderCrudService.GetByIdsAsync([entityId])).FirstOrDefault();
                conversationName = order?.CustomerOrder?.Number;
                iconUrl = order?.CustomerOrder?.Items?.FirstOrDefault()?.ImageUrl;
                break;
        }

        return (conversationName, iconUrl);
    }
}
