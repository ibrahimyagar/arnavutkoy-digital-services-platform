using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="CitizenRequest"/> aggregate root'u için EF Core Fluent API konfigürasyonu.
/// Mesaj koleksiyonu, tek sorguda getirilebilmesi için ayrı bir tabloda ilişkili olarak tutulur
/// (bkz. <see cref="RequestMessageConfiguration"/> ve repository'deki <c>Include</c> kullanımı).
/// </summary>
public sealed class CitizenRequestConfiguration : IEntityTypeConfiguration<CitizenRequest>
{
    public void Configure(EntityTypeBuilder<CitizenRequest> builder)
    {
        builder.ToTable("CitizenRequests");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.CitizenUserId);
        builder.HasIndex(x => x.Status);

        builder.HasMany(x => x.Messages)
            .WithOne()
            .HasForeignKey(x => x.CitizenRequestId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Navigation(x => x.Messages)
            .UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
