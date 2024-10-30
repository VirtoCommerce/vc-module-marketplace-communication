using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.MarketplaceVendorModule.Data.Services;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetSellerCommunicationUser;
public class GetSellerCommunicationUserQueryHandler : IQueryHandler<GetSellerCommunicationUserQuery, CommunicationUser>
{
    private readonly ISellerProductCrudService _sellerProductService;
    private readonly IOfferCrudService _offerCrudService;
    private readonly ISellerOrderCrudService _sellerOrderCrudService;
    private readonly ISellerCrudService _sellerCrudService;
    private readonly ICommunicationUserService _communicationUserService;

    public GetSellerCommunicationUserQueryHandler(
        ISellerProductCrudService sellerProductService,
        IOfferCrudService offerCrudService,
        ISellerOrderCrudService sellerOrderCrudService,
        ISellerCrudService sellerCrudService,
        ICommunicationUserService communicationUserService
        )
    {
        _sellerProductService = sellerProductService;
        _offerCrudService = offerCrudService;
        _sellerOrderCrudService = sellerOrderCrudService;
        _sellerCrudService = sellerCrudService;
        _communicationUserService = communicationUserService;
    }

    public virtual async Task<CommunicationUser> Handle(GetSellerCommunicationUserQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.EntityId))
        {
            throw new ArgumentNullException(nameof(request.EntityId));
        }

        if (string.IsNullOrEmpty(request.EntityType))
        {
            throw new ArgumentNullException(nameof(request.EntityType));
        }

        var sellerId = string.Empty;
        switch (request.EntityType)
        {
            case CoreModuleConstants.EntityType.Product:
                var product = (await _sellerProductService.GetAsync([request.EntityId])).FirstOrDefault();
                sellerId = product?.SellerId;
                break;
            case "Offer":
                var offer = (await _offerCrudService.GetAsync([request.EntityId])).FirstOrDefault();
                sellerId = offer?.SellerId;
                break;
            case CoreModuleConstants.EntityType.Order:
                var order = (await _sellerOrderCrudService.GetByIdsAsync([request.EntityId])).FirstOrDefault();
                sellerId = order?.SellerId;
                break;
        }

        if (string.IsNullOrEmpty(sellerId))
        {
            throw new InvalidOperationException($"{request.EntityType} with id {request.EntityId} has no Seller");
        }

        var seller = (await _sellerCrudService.GetAsync([sellerId])).FirstOrDefault();
        if (seller == null)
        {
            throw new InvalidOperationException($"Seller for {request.EntityType} with id {request.EntityId} not found");
        }

        var sellerCommunicationUser = await _communicationUserService.GetOrCreateCommunicationUser(sellerId, CoreModuleConstants.CommunicationUserType.Organization);
        return sellerCommunicationUser;
    }
}
