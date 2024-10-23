using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class DeleteMessageCommandHandler : ICommandHandler<DeleteMessageCommand>
{
    private readonly IMessageCrudService _messageCrudService;
    private readonly IMessageService _messageService;

    public DeleteMessageCommandHandler(
        IMessageCrudService messageCrudService,
        IMessageService messageService
        )
    {
        _messageCrudService = messageCrudService;
        _messageService = messageService;
    }

    public virtual async Task<Unit> Handle(DeleteMessageCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.MessageIds == null || request.MessageIds.Length == 0)
        {
            throw new ArgumentException(nameof(request.MessageIds));
        }

        var idsToDelete = new List<string>();
        if (request.WithReplies)
        {
            idsToDelete = GetChildMessageIdsRecursively(request.MessageIds);
        }
        else
        {
            idsToDelete.AddRange(request.MessageIds);
        }

        await _messageCrudService.DeleteAsync(idsToDelete);

        return Unit.Value;
    }

    protected virtual List<string> GetChildMessageIdsRecursively(string[] parendMessageId)
    {
        return new List<string>(parendMessageId);
        //throw new NotImplementedException();
    }
}
