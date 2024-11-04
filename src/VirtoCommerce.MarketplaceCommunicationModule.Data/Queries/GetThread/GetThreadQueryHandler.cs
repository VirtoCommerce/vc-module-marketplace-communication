using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetThread;
public class GetThreadQueryHandler : IQueryHandler<GetThreadQuery, IList<Message>>
{
    private readonly IMessageService _messageService;

    public GetThreadQueryHandler(
        IMessageService messageService
        )
    {
        _messageService = messageService;
    }

    public virtual async Task<IList<Message>> Handle(GetThreadQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        var result = await _messageService.GetThread(request.ThreadId);

        return result;
    }
}
