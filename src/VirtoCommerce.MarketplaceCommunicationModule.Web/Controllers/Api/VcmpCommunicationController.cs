using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VirtoCommerce.MarketplaceCommunicationModule.Core;
using VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceVendorModule.Core.Common;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.MarketplaceCommunicationModule.Web.Controllers.Api;

[ApiController]
[Route("api/vcmp/communication")]
public class VcmpCommunicationController : ControllerBase
{
    private readonly ISettingsManager _settingsManager;

    public VcmpCommunicationController(
        ISettingsManager settingsManager
        )
    {
        _settingsManager = settingsManager;
    }

    [HttpGet]
    [Route("settings")]
    [Authorize(ModuleConstants.Security.Permissions.Read)]
    public async Task<ActionResult<MarketplaceCommunicationSettings>> GetCommunicationSettings()
    {
        var settings = ExType<MarketplaceCommunicationSettings>.New();
        settings.AttachmentCountLimit = await _settingsManager.GetValueAsync<int>(ModuleConstants.Settings.General.AttachmentCountLimit);
        settings.AttachmentSizeLimit = await _settingsManager.GetValueAsync<int>(ModuleConstants.Settings.General.AttachmentSizeLimit);

        return Ok(settings);
    }
}
