using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
public class MarkMessageAsReadCommandHandler : ICommandHandler<MarkMessageAsReadCommand, Message>
{
    private readonly ICommunicationUserService _communicationUserService;
    private readonly IMessageService _messageService;

    public MarkMessageAsReadCommandHandler(
        ICommunicationUserService communicationUserService,
        IMessageService messageService
        )
    {
        _communicationUserService = communicationUserService;
        _messageService = messageService;
    }
    public virtual async Task<Message> Handle(MarkMessageAsReadCommand request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.MessageId))
        {
            throw new ArgumentNullException(nameof(request.MessageId));
        }

        var recipient = await _communicationUserService.GetCommunicationUserByUserId(request.SellerId, CoreModuleConstants.CommunicationUserType.Organization);
        if (recipient == null)
        {
            throw new InvalidOperationException($"Communication user for Seller with id {request.SellerId} not found");
        }

        var message = await _messageService.SetMessageReadStatus(request.MessageId, recipient.Id, request.NotRead);

        return message;
    }
}
