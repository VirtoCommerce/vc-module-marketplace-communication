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

    public static class Settings
    {
        public static class General
        {
            public static SettingDescriptor MarketplaceCommunicationModuleEnabled { get; } = new()
            {
                Name = "MarketplaceCommunicationModule.MarketplaceCommunicationModuleEnabled",
                GroupName = "MarketplaceCommunicationModule|General",
                ValueType = SettingValueType.Boolean,
                DefaultValue = false,
            };

            public static SettingDescriptor MarketplaceCommunicationModulePassword { get; } = new()
            {
                Name = "MarketplaceCommunicationModule.MarketplaceCommunicationModulePassword",
                GroupName = "MarketplaceCommunicationModule|Advanced",
                ValueType = SettingValueType.SecureString,
                DefaultValue = "qwerty",
            };

            public static IEnumerable<SettingDescriptor> AllGeneralSettings
            {
                get
                {
                    yield return MarketplaceCommunicationModuleEnabled;
                    yield return MarketplaceCommunicationModulePassword;
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
