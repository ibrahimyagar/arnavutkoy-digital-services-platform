using ArnavutkoyBelediyesi.Domain.Properties;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="CitizenProperty"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class CitizenPropertyConfiguration : IEntityTypeConfiguration<CitizenProperty>
{
    public void Configure(EntityTypeBuilder<CitizenProperty> builder)
    {
        builder.ToTable("CitizenProperties");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.DoorNumber)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.BlockParcel)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.OwnerUserId);
        builder.HasIndex(x => x.NeighborhoodId);
        builder.HasIndex(x => x.StreetId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
