using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class SearchMessagesQueryHandler : IQueryHandler<SearchMessagesQuery, SearchMessageResult>
{
    private readonly IMessageSearchService _messageSearchService;
    private readonly IConversationService _conversationService;

    public SearchMessagesQueryHandler(
        IMessageSearchService messageSearchService,
        IConversationService conversationService
        )
    {
        _messageSearchService = messageSearchService;
        _conversationService = conversationService;
    }

    public virtual async Task<SearchMessageResult> Handle(SearchMessagesQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.ConversationId) && !string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            request.ConversationId = (await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType))?.Id;
        }

        return await _messageSearchService.SearchAsync(request);
    }
}
