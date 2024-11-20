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

        var conversationId = request.ConversationId;
        if (string.IsNullOrEmpty(conversationId) && !string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            conversationId = (await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType))?.Id;
        }

        if (string.IsNullOrEmpty(conversationId))
        {
            throw new ArgumentException(nameof(request.ConversationId));
        }

        request.ConversationId = conversationId;
        return await _messageSearchService.SearchAsync(request);
    }
}
