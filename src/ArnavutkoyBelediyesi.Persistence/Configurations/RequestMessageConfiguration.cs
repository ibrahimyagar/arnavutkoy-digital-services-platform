using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="RequestMessage"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class RequestMessageConfiguration : IEntityTypeConfiguration<RequestMessage>
{
    public void Configure(EntityTypeBuilder<RequestMessage> builder)
    {
        builder.ToTable("RequestMessages");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Message)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.SenderType)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.CitizenRequestId);
    }
}
