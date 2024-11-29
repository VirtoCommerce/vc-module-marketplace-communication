using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class UpdateConversationCommandHandler : ICommandHandler<UpdateConversationCommand, Conversation>
{
    private readonly IConversationCrudService _conversationCrudService;

    public UpdateConversationCommandHandler(
        IConversationCrudService conversationCrudService
        )
    {
        _conversationCrudService = conversationCrudService;
    }

    public virtual async Task<Conversation> Handle(UpdateConversationCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        await _conversationCrudService.SaveChangesAsync([request.Conversation]);
        return request.Conversation;
    }
}
