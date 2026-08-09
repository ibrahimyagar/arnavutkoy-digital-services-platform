using ArnavutkoyBelediyesi.Domain.Geography;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="Neighborhood"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class NeighborhoodConfiguration : IEntityTypeConfiguration<Neighborhood>
{
    public void Configure(EntityTypeBuilder<Neighborhood> builder)
    {
        builder.ToTable("Neighborhoods");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(x => x.HeadmanFullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.HeadmanPhoneNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(x => x.DistrictId);
        builder.HasIndex(x => x.Name);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
