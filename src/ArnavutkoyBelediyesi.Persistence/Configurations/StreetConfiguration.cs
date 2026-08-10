using ArnavutkoyBelediyesi.Domain.Geography;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="Street"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class StreetConfiguration : IEntityTypeConfiguration<Street>
{
    public void Configure(EntityTypeBuilder<Street> builder)
    {
        builder.ToTable("Streets");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(150);

        builder.HasIndex(x => x.NeighborhoodId);
        builder.HasIndex(x => new { x.NeighborhoodId, x.Name });

        builder.HasOne<Neighborhood>()
            .WithMany()
            .HasForeignKey(x => x.NeighborhoodId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
