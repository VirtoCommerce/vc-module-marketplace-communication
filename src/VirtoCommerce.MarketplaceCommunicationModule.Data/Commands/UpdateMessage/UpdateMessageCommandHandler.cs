using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class UpdateMessageCommandHandler : ICommandHandler<UpdateMessageCommand>
{
    private readonly IMessageCrudService _messageCrudService;
    private readonly IMessageService _messageService;

    public UpdateMessageCommandHandler(
        IMessageCrudService messageCrudService,
        IMessageService messageService
        )
    {
        _messageCrudService = messageCrudService;
        _messageService = messageService;
    }

    public virtual async Task<Unit> Handle(UpdateMessageCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.MessageId))
        {
            throw new ArgumentNullException(nameof(request.MessageId));
        }

        var message = await _messageCrudService.GetByIdAsync(request.MessageId);

        if (message == null)
        {
            throw new InvalidOperationException($"Message with id {request.MessageId} not found");
        }

        message.Content = request.Content;
        if (!request.Attachments.IsNullOrEmpty())
        {
            message.Attachments = request.Attachments;
        }

        await _messageService.UpdateMessage(message);

        return Unit.Value;
    }
}
