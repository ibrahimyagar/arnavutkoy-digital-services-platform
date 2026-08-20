using ArnavutkoyBelediyesi.Domain.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

/// <summary>
/// <see cref="NotificationLog"/> entity'si için EF Core Fluent API konfigürasyonu.
/// </summary>
public sealed class NotificationLogConfiguration : IEntityTypeConfiguration<NotificationLog>
{
    public void Configure(EntityTypeBuilder<NotificationLog> builder)
    {
        builder.ToTable("NotificationLogs");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Subject)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Body)
            .IsRequired()
            .HasMaxLength(2000);

        builder.Property(x => x.ErrorMessage)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(x => x.Channel)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.Property(x => x.Status)
            .HasConversion<string>()
            .HasMaxLength(20);

        builder.HasIndex(x => x.RecipientUserId);
        builder.HasIndex(x => new { x.Channel, x.Status });

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
