using System.Collections.Generic;
using System.Linq;
using VirtoCommerce.Platform.Core.Security;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.MarketplaceCommunicationModule.Core;

public static class ModuleConstants
{
    public static class Security
    {
        public static class Permissions
        {
            public const string Read = "seller:message:read";
            public const string Send = "seller:message:send";
            public const string Edit = "seller:message:edit";
            public const string Delete = "seller:message:delete";

            public static string[] AllPermissions { get; } =
            {
                Read,
                Send,
                Edit,
                Delete
            };
        }

        public static class Roles
        {
            public static readonly Role Operator = new()
            {
                Id = "vcmp-operator-role",
                Permissions = new[]
                {
                    Permissions.Read,
                    Permissions.Send,
                    Permissions.Edit,
                    Permissions.Delete
                }
                .Select(x => new Permission { GroupName = "Marketplace", Name = x })
                .ToList()
            };

            public static readonly Role VendorOwner = new()
            {
                Id = "vcmp-owner-role",
                Permissions = new[]
                {
                    Permissions.Read,
                    Permissions.Send,
                    Permissions.Edit,
                    Permissions.Delete
                }
                .Select(x => new Permission { GroupName = "Marketplace", Name = x })
                .ToList()
            };

            public static readonly Role VendorAdmin = new()
            {
                Id = "vcmp-admin-role",
                Permissions = new[]
                {
                    Permissions.Read,
                    Permissions.Send
                }
                .Select(x => new Permission { GroupName = "Marketplace", Name = x })
                .ToList()
            };

            public static readonly Role VendorAgent = new()
            {
                Id = "vcmp-agent-role",
                Permissions = new[]
                {
                    Permissions.Read,
                    Permissions.Send
                }
                .Select(x => new Permission { GroupName = "Marketplace", Name = x })
                .ToList()
            };

            public static Role[] AllRoles = { Operator, VendorOwner, VendorAdmin, VendorAgent };

        }

    }

    public static class EntityType
    {
        public const string Product = "VirtoCommerce.MarketplaceVendorModule.Core.Domains.SellerProduct";
        public const string Order = "VirtoCommerce.OrdersModule.Core.Model.CustomerOrder";
        public const string Offer = "VirtoCommerce.MarketplaceVendorModule.Core.Domains.Offer";
    }

    public static class Settings
    {
        public static class General
        {
            public static SettingDescriptor AttachmentCountLimit { get; } = new()
            {
                Name = "MarketplaceCommunication.AttachmentCountLimit",
                GroupName = "Marketplace Communication|General",
                ValueType = SettingValueType.Integer,
                DefaultValue = 5
            };

            public static SettingDescriptor AttachmentSizeLimit { get; } = new()
            {
                Name = "MarketplaceCommunication.AttachmentSizeLimit",
                GroupName = "Marketplace Communication|General",
                ValueType = SettingValueType.Integer,
                DefaultValue = 1
            };

            public static IEnumerable<SettingDescriptor> AllGeneralSettings
            {
                get
                {
                    yield return AttachmentCountLimit;
                    yield return AttachmentSizeLimit;
                }
            }
        }

        public static IEnumerable<SettingDescriptor> AllSettings
        {
            get
            {
                return General.AllGeneralSettings;
            }
        }
    }
}
