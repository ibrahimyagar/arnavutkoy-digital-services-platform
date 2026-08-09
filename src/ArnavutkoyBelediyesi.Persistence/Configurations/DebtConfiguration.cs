using ArnavutkoyBelediyesi.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="Debt"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class DebtConfiguration : IEntityTypeConfiguration<Debt>
{
    public void Configure(EntityTypeBuilder<Debt> builder)
    {
        builder.ToTable("Debts");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.PrincipalAmount)
            .HasPrecision(12, 2);

        builder.Property(x => x.Type)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.DebtorUserId);
        builder.HasIndex(x => new { x.Status, x.DueDateUtc });

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
