using System.Threading.Tasks;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.CommunicationModule.Core.Models.Search;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Commands;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Queries;
using VirtoCommerce.MarketplaceVendorModule.Data.Authorization;

namespace VirtoCommerce.MarketplaceCommunicationModule.Web.Controllers.Api;

[ApiController]
[Route("api/vcmp/message")]
public class VcmpMessageController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IAuthorizationService _authorizationService;

    public VcmpMessageController(
        IMediator mediator,
        IAuthorizationService authorizationService
        )
    {
        _mediator = mediator;
        _authorizationService = authorizationService;
    }

    [HttpPost]
    [Route("search")]
    public async Task<ActionResult<SearchMessageResult>> Search([FromBody] SearchMessagesQuery query)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, query, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(query);

        return Ok(result);
    }

    [HttpPost]
    [Route("new")]
    public async Task<ActionResult> SendMessage([FromBody] SendMessageCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Send));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(command);

        return Ok();
    }

    [HttpPost]
    [Route("update")]
    public async Task<ActionResult> UpdateMessage([FromBody] UpdateMessageCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Edit));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(command);

        return Ok();
    }

    [HttpDelete]
    [Route("")]
    public async Task<ActionResult> DeleteMessage([FromBody] DeleteMessageCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Delete));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(command);

        return Ok();
    }

    [HttpPost]
    [Route("markread")]
    public async Task<ActionResult> MarkMessageAsRead([FromBody] MarkMessageAsReadCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(command);

        return Ok();
    }

    [HttpPost]
    [Route("sendreaction")]
    public async Task<ActionResult> SendReaction([FromBody] SendReactionCommand command)
    {
        var authorizationResult = await _authorizationService.AuthorizeAsync(User, command, new SellerAuthorizationRequirement(Core.ModuleConstants.Security.Permissions.Read));
        if (!authorizationResult.Succeeded)
        {
            return Unauthorized();
        }
        var result = await _mediator.Send(command);

        return Ok();
    }
}