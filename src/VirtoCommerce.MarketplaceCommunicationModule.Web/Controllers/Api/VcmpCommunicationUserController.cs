using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Queries.GetOperator;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Web.Controllers.Api;

[ApiController]
[Route("api/vcmp/communicationuser")]
public class VcmpCommunicationUserController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuthorizationService _authorizationService;

    public VcmpCommunicationUserController(
        IMediator mediator,
        IAuthorizationService authorizationService
        )
    {
        _mediator = mediator;
        _authorizationService = authorizationService;
    }

    [HttpGet]
    [Route("info")]
    [Authorize(Core.ModuleConstants.Security.Permissions.Read)]
    public async Task<ActionResult<CommunicationUser[]>> GetCommunicationUsers([FromQuery] string[] communicationUserIds)
    {
        var query = AbstractTypeFactory<GetCommunicationUsersQuery>.TryCreateInstance();
        query.CommunicationUserIds = communicationUserIds;

        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpGet]
    [Route("operator")]
    [Authorize(Core.ModuleConstants.Security.Permissions.Read)]
    public async Task<ActionResult<CommunicationUser>> GetOperator()
    {
        var query = AbstractTypeFactory<GetOperatorQuery>.TryCreateInstance();

        var result = await _mediator.Send(query);

        return Ok(result);
    }
}
