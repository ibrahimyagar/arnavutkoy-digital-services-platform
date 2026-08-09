using ArnavutkoyBelediyesi.Domain.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="Payment"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Amount)
            .HasPrecision(12, 2);

        builder.Property(x => x.CardHolderName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.MaskedCardNumber)
            .IsRequired()
            .HasMaxLength(25);

        builder.HasIndex(x => x.DebtId).IsUnique();
        builder.HasIndex(x => x.PayerUserId);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
