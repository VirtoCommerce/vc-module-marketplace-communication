using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands.CreateConversation;
public class CreateConversationCommandHandler : ICommandHandler<CreateConversationCommand, Conversation>
{
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IConversationService _conversationService;

    public CreateConversationCommandHandler(
        ICommunicationUserService communicationUserService,
        IConversationService conversationService
        )
    {
        _communicationUserService = communicationUserService;
        _conversationService = conversationService;
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

        var result = await _conversationService.CreateConversation(userIds, request.Name, request.IconUrl, request.EntityId, request.EntityType);

        return result;
    }
}
