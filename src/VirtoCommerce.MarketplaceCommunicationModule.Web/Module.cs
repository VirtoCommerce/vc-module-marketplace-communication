using MediatR;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using VirtoCommerce.MarketplaceCommunicationModule.Core;
using VirtoCommerce.MarketplaceCommunicationModule.Core.Models;
using VirtoCommerce.MarketplaceCommunicationModule.Data.Repositories;
using VirtoCommerce.MarketplaceCommunicationModule.Web.Authorization;
using VirtoCommerce.Platform.Core.Modularity;
using VirtoCommerce.Platform.Core.Settings;

namespace VirtoCommerce.MarketplaceCommunicationModule.Web;

public class Module : IModule, IHasConfiguration
{
    public ManifestModuleInfo ModuleInfo { get; set; }
    public IConfiguration Configuration { get; set; }

    public void Initialize(IServiceCollection serviceCollection)
    {
        // Initialize database
        var connectionString = Configuration.GetConnectionString(ModuleInfo.Id) ??
                               Configuration.GetConnectionString("VirtoCommerce");

        serviceCollection.AddDbContext<MarketplaceCommunicationModuleDbContext>(options => options.UseSqlServer(connectionString));

        serviceCollection.AddMediatR(typeof(Data.Anchor));

        serviceCollection.AddSingleton<IUserIdProvider, PushNotificationOperatorIdProvider>();
    }

    public void PostInitialize(IApplicationBuilder appBuilder)
    {
        var serviceProvider = appBuilder.ApplicationServices;

        // Register settings
        var settingsRegistrar = serviceProvider.GetRequiredService<ISettingsRegistrar>();
        settingsRegistrar.RegisterSettings(ModuleConstants.Settings.AllSettings, ModuleInfo.Id);

        //Register module authorization
        appBuilder.UseModuleAuthorization();

        // Apply migrations
        using var serviceScope = serviceProvider.CreateScope();
        using var dbContext = serviceScope.ServiceProvider.GetRequiredService<MarketplaceCommunicationModuleDbContext>();
        dbContext.Database.Migrate();

    }

    public void Uninstall()
    {
        // Nothing to do here
    }
}
