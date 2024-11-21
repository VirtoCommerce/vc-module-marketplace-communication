using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetConversationQueryHandler : IQueryHandler<GetConversationQuery, Conversation>
{
    private readonly IConversationService _conversationService;
    private readonly IConversationCrudService _conversationCrudService;

    public GetConversationQueryHandler(
        IConversationService conversationService,
        IConversationCrudService conversationCrudService
        )
    {
        _conversationService = conversationService;
        _conversationCrudService = conversationCrudService;
    }

    public virtual async Task<Conversation> Handle(GetConversationQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (!string.IsNullOrEmpty(request.ConversationId))
        {
            return await _conversationCrudService.GetByIdAsync(request.ConversationId);
        }

        if (!string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            return await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType);
        }

        return null;
    }
}
