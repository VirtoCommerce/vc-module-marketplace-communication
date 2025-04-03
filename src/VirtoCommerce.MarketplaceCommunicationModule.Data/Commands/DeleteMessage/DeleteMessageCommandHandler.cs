using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class DeleteMessageCommandHandler : ICommandHandler<DeleteMessageCommand>
{
    private readonly IMessageService _messageService;

    public DeleteMessageCommandHandler(
        IMessageService messageService
        )
    {
        _messageService = messageService;
    }

    public virtual async Task Handle(DeleteMessageCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.MessageIds == null || request.MessageIds.Length == 0)
        {
            throw new ArgumentException(nameof(request.MessageIds));
        }

        await _messageService.DeleteMessage(request.MessageIds, false);
    }
}
