using System.Linq;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using VirtoCommerce.CustomerModule.Core.Model;
using VirtoCommerce.CustomerModule.Core.Model.Search;
using VirtoCommerce.CustomerModule.Core.Services;
using VirtoCommerce.MarketplaceVendorModule.Core;
using VirtoCommerce.Platform.Core.Common;

namespace VirtoCommerce.MarketplaceCommunicationModule.Core.Services;
public class PushNotificationOperatorIdProvider : IUserIdProvider
{
    private readonly IMemberSearchService _memberSearchService;
    private readonly MarketplaceOptions _options;

    public PushNotificationOperatorIdProvider(
        IMemberSearchService memberSearchService,
        IOptions<MarketplaceOptions> options
        )
    {
        _memberSearchService = memberSearchService;
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
            var membersSearchCriteria = AbstractTypeFactory<MembersSearchCriteria>.TryCreateInstance();
            membersSearchCriteria.ObjectIds = [userMemberId];
            membersSearchCriteria.MemberType = typeof(Employee).Name;

            var member = _memberSearchService.SearchMembersAsync(membersSearchCriteria).GetAwaiter().GetResult().Results.FirstOrDefault();
            if (member is Employee employee && employee.Organizations.Contains(_options.OperatorGroupId))
            {
                return _options.OperatorGroupId;
            }
        }

        return userMemberId;
    }
}
