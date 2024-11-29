using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.CommunicationModule.Core.Models;
using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
using VirtoCommerce.MarketplaceVendorModule.Data.Authorization;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Web.Controllers.Api;

[ApiController]
[Route("api/vcmp/conversation")]
public class VcmpConversationController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuthorizationService _authorizationService;

    public VcmpConversationController(
        IMediator mediator,
        IAuthorizationService authorizationService
        )
    {
        _mediator = mediator;
        _authorizationService = authorizationService;
    }

    [HttpPost]
    [Route("search")]
    public async Task<ActionResult<SearchConversationResult>> Search([FromBody] SearchConversationsQuery query)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, query, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Forbid();
        }
        var result = await _mediator.Send(query);

        return Ok(result);
    }


    [HttpGet]
    [Route("getbyid")]
    public async Task<ActionResult<Conversation>> GetById([FromQuery] string conversationId)
    {
        var query = AbstractTypeFactory<GetConversationQuery>.TryCreateInstance();
        query.ConversationId = conversationId;

        var authorizationResult = await _authorizationService.AuthorizeAsync(User, query, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Forbid();
        }
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpGet]
    [Route("getbyentity")]
    public async Task<ActionResult<Conversation>> GetByEntity([FromQuery] string entityId, [FromQuery] string entityType)
    {
        var query = AbstractTypeFactory<GetConversationQuery>.TryCreateInstance();
        query.EntityId = entityId;
        query.EntityType = entityType;

        var authorizationResult = await _authorizationService.AuthorizeAsync(User, query, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Forbid();
        }
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpPost]
    [Route("new")]
    public async Task<ActionResult<Conversation>> CreateConversation([FromBody] CreateConversationCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Send));
        if (!authorizationResult.Succeeded)
        {
            return Forbid();
        }
        var result = await _mediator.Send(command);

        return Ok(result);
    }

    [HttpPost]
    [Route("update")]
    public async Task<ActionResult<Conversation>> UpdateConversation([FromBody] UpdateConversationCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Send));
        if (!authorizationResult.Succeeded)
        {
            return Forbid();
        }
        var result = await _mediator.Send(command);

        return Ok(result);
    }
}
