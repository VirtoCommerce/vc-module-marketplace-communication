using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using VirtoCommerce.CustomerModule.Core.Model;
using VirtoCommerce.CustomerModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core;

namespace VirtoCommerce.MarketplaceCommunicationModule.Core.Services;
public class PushNotificationOperatorIdProvider : IUserIdProvider
{
    private readonly IMemberService _memberService;
    private readonly MarketplaceOptions _options;

    public PushNotificationOperatorIdProvider(
        IMemberService memberService,
        IOptions<MarketplaceOptions> options
        )
    {
        _memberService = memberService;
        _options = options.Value;
    }

    public virtual string GetUserId(HubConnectionContext connection)
    {
        var userRole = connection.User.FindFirstValue("role");
        var userMemberId = connection.User.FindFirstValue("memberId");

        if (userRole == "__administrator")
        {
            return _options.OperatorGroupId;
        }

        if (userRole == "__manager")
        {
            var member = _memberService.GetByIdAsync(userMemberId).GetAwaiter().GetResult();
            if (member is Employee employee && employee.Organizations.Contains(_options.OperatorGroupId))
            {
                return _options.OperatorGroupId;
            }
        }

        return userMemberId;
    }
}
