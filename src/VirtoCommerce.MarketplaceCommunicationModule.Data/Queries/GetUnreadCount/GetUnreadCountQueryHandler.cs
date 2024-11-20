using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetUnreadCount;
public class GetUnreadCountQueryHandler : IQueryHandler<GetUnreadCountQuery, int>
{
    private readonly IMessageService _messageService;
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationService _conversationService;

    public GetUnreadCountQueryHandler(
        IMessageService messageService,
        ICommunicationUserService communicationUserService,
        IConversationService conversationService
        )
    {
        _messageService = messageService;
        _communicationUserService = communicationUserService;
        _conversationService = conversationService;
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
            var sellerCommunicationUser = await _communicationUserService.GetOrCreateCommunicationUser(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization);
            recipientId = sellerCommunicationUser?.Id;
        }

        if (string.IsNullOrEmpty(recipientId))
        {
            throw new ArgumentNullException(nameof(request.RecipientId));
        }

        var conversation = await _conversationService.GetConversationByEntity(request.EntityId, request.EntityType);

        var result = await _messageService.GetUnreadMessagesCount(recipientId, conversation?.Id);

        return result;
    }
}
