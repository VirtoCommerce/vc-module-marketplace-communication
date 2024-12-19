using System;
using System.Threading;
using System.Threading.Tasks;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetOrCreateCommunicationUser;
public class GetOrCreateCommunicationUserQueryHandler : IQueryHandler<GetOrCreateCommunicationUserQuery, CommunicationUser>
{
    private readonly ICommunicationUserService _communicationUserService;

    public GetOrCreateCommunicationUserQueryHandler(
        ICommunicationUserService communicationUserService
        )
    {
        _communicationUserService = communicationUserService;
    }

    public virtual async Task<CommunicationUser> Handle(GetOrCreateCommunicationUserQuery request, CancellationToken cancellationToken)
    {
        if (request == null)
        {
            throw new ArgumentNullException(nameof(request));
        }

        if (string.IsNullOrEmpty(request.UserId))
        {
            throw new ArgumentNullException(nameof(request.UserId));
        }

        if (string.IsNullOrEmpty(request.UserType))
        {
            throw new ArgumentNullException(nameof(request.UserType));
        }

        var communicationUser = await _communicationUserService.GetOrCreateCommunicationUser(request.UserId, request.UserType);
        return communicationUser;
    }
}
