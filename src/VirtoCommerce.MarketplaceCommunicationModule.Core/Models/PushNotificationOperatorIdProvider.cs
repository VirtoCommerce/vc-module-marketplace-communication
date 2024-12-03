using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Options;
using VirtoCommerce.MarketplaceVendorModule.Core;

namespace VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
public class PushNotificationOperatorIdProvider : IUserIdProvider
{
    private readonly MarketplaceOptions _options;

    public PushNotificationOperatorIdProvider(
        IOptions<MarketplaceOptions> options
        )
    {
        _options = options.Value;
    }

    public virtual string GetUserId(HubConnectionContext connection)
    {
        return _options.OperatorGroupId;
    }
}
