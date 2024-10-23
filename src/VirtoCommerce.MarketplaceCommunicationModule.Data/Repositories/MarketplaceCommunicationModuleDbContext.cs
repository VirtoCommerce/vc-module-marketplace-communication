using Microsoft.EntityFrameworkCore;
using VirtoCommerce.Platform.Data.Infrastructure;

namespace VirtoCommerce.MarketplaceCommunicationModule.Data.Repositories;

public class MarketplaceCommunicationModuleDbContext : DbContextBase
{
    public MarketplaceCommunicationModuleDbContext(DbContextOptions<MarketplaceCommunicationModuleDbContext> options)
        : base(options)
    {
    }

    protected MarketplaceCommunicationModuleDbContext(DbContextOptions options)
        : base(options)
    {
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        //modelBuilder.Entity<MarketplaceCommunicationModuleEntity>().ToTable("MarketplaceCommunicationModule").HasKey(x => x.Id);
        //modelBuilder.Entity<MarketplaceCommunicationModuleEntity>().Property(x => x.Id).HasMaxLength(128).ValueGeneratedOnAdd();
    }
}
