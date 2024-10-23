using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using CoreModuleConstants = VirtoCommerce.CommunicationModule.Core.ModuleConstants;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetOperator;
public class GetOperatorQueryHandler : IQueryHandler<GetOperatorQuery, CommunicationUser>
{
    private readonly ICommunicationUserService _communicationUserService;
    private readonly MarketplaceOptions _options;

    public GetOperatorQueryHandler(
        ICommunicationUserService communicationUserService,
        IOptions<MarketplaceOptions> options
        )
    {
        _communicationUserService = communicationUserService;
        _options = options.Value;
    }

    public virtual async Task<CommunicationUser> Handle(GetOperatorQuery request, CancellationToken cancellationToken)
    {
        var operatorGroupId = _options.OperatorGroupId;

        var operatorCommunicationUser = await _communicationUserService.GetCommunicationUserByUserId(operatorGroupId, CoreModuleConstants.CommunicationUserType.Organization);
        if (operatorCommunicationUser == null)
        {
            operatorCommunicationUser = await _communicationUserService.CreateCommunicationUser(operatorGroupId, CoreModuleConstants.CommunicationUserType.Organization);
        }

        return operatorCommunicationUser;
    }
}
