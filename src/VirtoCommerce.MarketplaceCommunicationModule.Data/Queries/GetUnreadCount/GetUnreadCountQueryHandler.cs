using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetUnreadCount;
public class GetUnreadCountQueryHandler : IQueryHandler<GetUnreadCountQuery, int>
{
    private readonly IMessageService _messageService;
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationService _conversationService;
    private readonly MarketplaceOptions _options;

    public GetUnreadCountQueryHandler(
        IMessageService messageService,
        ICommunicationUserService communicationUserService,
        IConversationService conversationService,
        IOptions<MarketplaceOptions> options
        )
    {
        _messageService = messageService;
        _communicationUserService = communicationUserService;
        _conversationService = conversationService;
        _options = options.Value;
    }

    public virtual async Task<int> Handle(GetUnreadCountQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var recipientId = request.RecipientId;

        if (string.IsNullOrEmpty(recipientId))
        {
            var userId = request.IsOperator && string.IsNullOrEmpty(request.SellerId) ? _options.OperatorGroupId : request.SellerId;
            var recipient = await _communicationUserService.GetOrCreateCommunicationUser(userId, CoreModuleConstants.CommunicationUserType.Organization);
            recipientId = recipient?.Id;
        }

        if (string.IsNullOrEmpty(recipientId))
        {
            throw new ArgumentNullException(nameof(request.RecipientId));
        }

        var conversationId = await GetConversationIdAsync(request, recipientId);

        var result = await _messageService.GetUnreadMessagesCount(recipientId, conversationId);

        return result;
    }

    protected virtual async Task<string> GetConversationIdAsync(GetUnreadCountQuery request, string recipientId)
    {
        if (!string.IsNullOrEmpty(request.EntityId) && !string.IsNullOrEmpty(request.EntityType))
        {
            return (await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType))?.Id;
        }

        // No entity: the direct conversation between the recipient and the seller (the operator's vendor widget)
        if (string.IsNullOrEmpty(request.SellerId))
        {
            return null;
        }

        // Look up without creating: a seller nobody has written to has no communication user and no conversation
        var seller = await _communicationUserService.GetCommunicationUserByUserId(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization);
        if (seller == null || seller.Id == recipientId)
        {
            return null;
        }

        return (await _conversationService.GetConversationByUsers([recipientId, seller.Id]))?.Id;
    }
}
