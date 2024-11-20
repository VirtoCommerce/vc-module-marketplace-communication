using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetConversationQueryHandler : IQueryHandler<GetConversationQuery, Conversation>
{
    private readonly IConversationService _conversationService;

    public GetConversationQueryHandler(
        IConversationService conversationService
        )
    {
        _conversationService = conversationService;
    }

    public virtual async Task<Conversation> Handle(GetConversationQuery request, CancellationToken cancellationToken)
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

        var result = await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType);

        return result;
    }
}
