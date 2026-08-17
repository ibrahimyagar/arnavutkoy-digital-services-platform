using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

public sealed class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.Property(x => x.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(x => x.NationalId)
            .IsRequired(false)
            .HasMaxLength(11);

        builder.HasIndex(x => x.NationalId)
            .IsUnique()
            .HasFilter("\"NationalId\" IS NOT NULL");

        builder.HasIndex(x => x.NormalizedEmail)
            .IsUnique()
            .HasFilter("\"NormalizedEmail\" IS NOT NULL")
            .HasDatabaseName("EmailIndex");

        builder.Property(x => x.Gender)
            .IsRequired()
            .HasMaxLength(1);

        builder.Property(x => x.CreatedAtUtc)
            .IsRequired();
    }
}
