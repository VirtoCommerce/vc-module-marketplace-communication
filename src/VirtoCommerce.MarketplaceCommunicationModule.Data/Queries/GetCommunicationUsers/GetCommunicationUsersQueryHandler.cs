using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetCommunicationUsers;
public class GetCommunicationUsersQueryHandler : IQueryHandler<GetCommunicationUsersQuery, CommunicationUser[]>
{
    private readonly ICommunicationUserCrudService _communicationUserCrudService;

    public GetCommunicationUsersQueryHandler(
        ICommunicationUserCrudService communicationUserCrudService
        )
    {
        _communicationUserCrudService = communicationUserCrudService;
    }

    public virtual async Task<CommunicationUser[]> Handle(GetCommunicationUsersQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (request.CommunicationUserIds == null || request.CommunicationUserIds.Length == 0)
        {
            throw new ArgumentException(nameof(request.CommunicationUserIds));
        }

        var idsToRequest = request.CommunicationUserIds.Distinct().ToList();
        return (await _communicationUserCrudService.GetAsync(idsToRequest)).ToArray();
    }
}
