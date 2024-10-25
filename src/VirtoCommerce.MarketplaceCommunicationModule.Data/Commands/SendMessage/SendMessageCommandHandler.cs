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
    private readonly ICommunicationUserService _communicationUserService;

    public SendMessageCommandHandler(
        IMessageService messageService,
        ICommunicationUserService communicationUserService
        )
    {
        _messageService = messageService;
        _communicationUserService = communicationUserService;
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
        message.SenderId = request.Message.SenderId ?? (await GetOrCreateCommunicationUserForSeller(request.SellerId)).Id;
        message.Content = request.Message.Content;
        message.EntityId = request.Message.EntityId;
        message.EntityType = request.Message.EntityType;
        message.ThreadId = request.Message.ReplyTo;

        var messageRecipient = AbstractTypeFactory<MessageRecipient>.TryCreateInstance();
        messageRecipient.RecipientId = request.Message.RecipientId;
        messageRecipient.ReadStatus = CoreModuleConstants.ReadStatus.New;
        message.Recipients = new List<MessageRecipient> { messageRecipient };

        await _messageService.SendMessage(message);
        return Unit.Value;
    }

    protected virtual async Task<CommunicationUser> GetOrCreateCommunicationUserForSeller(string sellerId)
    {
        var communicationUser = await _communicationUserService.GetCommunicationUserByUserId(sellerId, CoreModuleConstants.CommunicationUserType.Organization);
        if (communicationUser == null)
        {
            communicationUser = await _communicationUserService.CreateCommunicationUser(sellerId, CoreModuleConstants.CommunicationUserType.Organization);
        }

        return communicationUser;
    }
}
