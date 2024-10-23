using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class SendMessageCommandHandler : ICommandHandler<SendMessageCommand>
{
    private readonly IMessageService _messageService;

    public SendMessageCommandHandler(
        IMessageService messageService
        )
    {
        _messageService = messageService;
    }

    public virtual async Task<Unit> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.Message == null)
        {
            throw new ArgumentNullException(nameof(request.Message));
        }

        var message = AbstractTypeFactory<Message>.TryCreateInstance();
        message.SenderId = request.Message.SenderId ?? request.SellerId;
        message.Content = request.Message.Content;
        message.EntityId = request.Message.ProductId;
        message.ThreadId = request.Message.ReplyTo;
        message.EntityType = CoreModuleConstants.EntityType.Product;

        var messageRecipient = AbstractTypeFactory<MessageRecipient>.TryCreateInstance();
        messageRecipient.RecipientId = request.Message.RecipientId;
        messageRecipient.ReadStatus = CoreModuleConstants.ReadStatus.New;
        message.Recipients = new List<MessageRecipient> { messageRecipient };

        await _messageService.SendMessage(message);
        return Unit.Value;
    }
}
