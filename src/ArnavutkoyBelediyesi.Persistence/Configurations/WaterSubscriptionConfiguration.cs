using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="WaterSubscription"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class WaterSubscriptionConfiguration : IEntityTypeConfiguration<WaterSubscription>
{
    public void Configure(EntityTypeBuilder<WaterSubscription> builder)
    {
        builder.ToTable("WaterSubscriptions");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.SubscriptionNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.SubscriptionNumber).IsUnique();
        builder.HasIndex(x => x.SubscriberUserId);
        builder.HasIndex(x => x.NeighborhoodId);
        builder.HasIndex(x => x.PropertyId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
