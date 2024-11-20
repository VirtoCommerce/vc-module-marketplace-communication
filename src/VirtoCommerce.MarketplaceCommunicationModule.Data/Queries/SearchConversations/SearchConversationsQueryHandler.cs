using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchConversationsQueryHandler : IQueryHandler<SearchConversationsQuery, SearchConversationResult>
{
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationSearchService _conversationSearchService;

    public SearchConversationsQueryHandler(
        ICommunicationUserService communicationUserService,
        IConversationSearchService conversationSearchService
        )
    {
        _communicationUserService = communicationUserService;
        _conversationSearchService = conversationSearchService;
    }

    public virtual async Task<SearchConversationResult> Handle(SearchConversationsQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var userId = request.UserId;

        if (string.IsNullOrEmpty(userId) && !string.IsNullOrEmpty(request.SellerId))
        {
            var sellerCommunicationUser = await _communicationUserService.GetOrCreateCommunicationUser(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization);
            userId = sellerCommunicationUser?.Id;
        }

        if (string.IsNullOrEmpty(userId))
        {
            throw new ArgumentException(nameof(request.UserId));
        }

        var result = await _conversationSearchService.SearchAsync(request);

        return result;
    }
}
