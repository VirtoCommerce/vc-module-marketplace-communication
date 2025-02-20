using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Data.Services;
using static VirtoCommerce.MarketplaceCommunicationModule.Core.ModuleConstants;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands.CreateConversation;
public class CreateConversationCommandHandler : ICommandHandler<CreateConversationCommand, Conversation>
{
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationService _conversationService;
    private readonly ISellerProductCrudService _sellerProductService;
    private readonly IOfferCrudService _offerCrudService;
    private readonly ISellerOrderCrudService _sellerOrderCrudService;

    public CreateConversationCommandHandler(
        ICommunicationUserService communicationUserService,
        IConversationService conversationService,
        ISellerProductCrudService sellerProductService,
        IOfferCrudService offerCrudService,
        ISellerOrderCrudService sellerOrderCrudService
        )
    {
        _communicationUserService = communicationUserService;
        _conversationService = conversationService;
        _sellerProductService = sellerProductService;
        _offerCrudService = offerCrudService;
        _sellerOrderCrudService = sellerOrderCrudService;
    }

    public virtual async Task<Conversation> Handle(CreateConversationCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var sellerCommunicationUserId = string.Empty;
        if (!string.IsNullOrEmpty(request.SellerId))
        {
            sellerCommunicationUserId = (await _communicationUserService.GetOrCreateCommunicationUser(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization))?.Id;
        }

        var userIds = request.UserIds.ToList();
        if (!string.IsNullOrEmpty(sellerCommunicationUserId))
        {
            userIds.Add(sellerCommunicationUserId);
        }

        userIds = userIds.Distinct().ToList();

        string conversationName = request.Name;
        string iconUrl = request.IconUrl;

        if (string.IsNullOrEmpty(conversationName) && !string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            (conversationName, iconUrl) = await GetConversationNameByEntity(request.EntityId, request.EntityType);
        }

        var result = await _conversationService.GetOrCreateConversation(userIds, conversationName, iconUrl, request.EntityId, request.EntityType);

        return result;
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
