using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Repositories;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<MarketplaceCommunicationModuleDbContext>
{
    public MarketplaceCommunicationModuleDbContext CreateDbContext(string[] args)
    {
        var builder = new DbContextOptionsBuilder<MarketplaceCommunicationModuleDbContext>();
        var connectionString = args.Length != 0 ? args[0] : "Server=(local);User=virto;Password=virto;Database=VirtoCommerce3;";

        builder.UseSqlServer(
            connectionString,
            options => options.MigrationsAssembly(GetType().Assembly.GetName().Name));

        return new MarketplaceCommunicationModuleDbContext(builder.Options);
    }
}
