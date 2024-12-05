using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
public class GetMessageQueryHandler : IQueryHandler<GetMessageQuery, Message>
{
    private readonly IMessageCrudService _messageCrudService;

    public GetMessageQueryHandler(
        IMessageCrudService messageCrudService
        )
    {
        _messageCrudService = messageCrudService;
    }

    public virtual async Task<Message> Handle(GetMessageQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.MessageId))
        {
            throw new ArgumentNullException(nameof(request.MessageId));
        }

        var result = await _messageCrudService.GetByIdAsync(request.MessageId);

        return result;
    }
}
