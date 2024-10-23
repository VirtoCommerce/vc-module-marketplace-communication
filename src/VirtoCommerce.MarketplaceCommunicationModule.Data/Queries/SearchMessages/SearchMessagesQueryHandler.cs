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

    public SearchMessagesQueryHandler(
        IMessageSearchService messageSearchService
        )
    {
        _messageSearchService = messageSearchService;
    }

    public virtual async Task<SearchMessageResult> Handle(SearchMessagesQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.EntityId))
        {
            throw new ArgumentException(nameof(request.EntityId));
        }

        if (string.IsNullOrEmpty(request.EntityType))
        {
            throw new ArgumentException(nameof(request.EntityType));
        }

        return await _messageSearchService.SearchAsync(request);
    }
}
