using ArnavutkoyBelediyesi.Domain.EServices;
using ArnavutkoyBelediyesi.Domain.Portal;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

public sealed class PortalContentConfiguration : IEntityTypeConfiguration<PortalContent>
{
    public void Configure(EntityTypeBuilder<PortalContent> builder)
    {
        builder.ToTable("PortalContents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Kind).HasConversion<string>().HasMaxLength(32);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(220);
        builder.Property(x => x.Summary).IsRequired().HasMaxLength(500);
        builder.Property(x => x.Body).IsRequired().HasMaxLength(8000);
        builder.Property(x => x.Slug).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Location).HasMaxLength(200);
        builder.Property(x => x.Category).HasMaxLength(100);
        builder.HasIndex(x => new { x.Kind, x.IsPublished, x.SortOrder });
        builder.HasIndex(x => x.Slug).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class SportsFacilityConfiguration : IEntityTypeConfiguration<SportsFacility>
{
    public void Configure(EntityTypeBuilder<SportsFacility> builder)
    {
        builder.ToTable("SportsFacilities");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Address).IsRequired().HasMaxLength(240);
        builder.Property(x => x.ActivityType).IsRequired().HasMaxLength(80);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class SportsAppointmentConfiguration : IEntityTypeConfiguration<SportsAppointment>
{
    public void Configure(EntityTypeBuilder<SportsAppointment> builder)
    {
        builder.ToTable("SportsAppointments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TrackingCode).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(x => x.TrackingCode).IsUnique();
        builder.HasIndex(x => new { x.FacilityId, x.SlotStartUtc });
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class MarriageSlotConfiguration : IEntityTypeConfiguration<MarriageSlot>
{
    public void Configure(EntityTypeBuilder<MarriageSlot> builder)
    {
        builder.ToTable("MarriageSlots");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.HallName).IsRequired().HasMaxLength(120);
        builder.HasIndex(x => x.CeremonyAtUtc);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class MarriageBookingConfiguration : IEntityTypeConfiguration<MarriageBooking>
{
    public void Configure(EntityTypeBuilder<MarriageBooking> builder)
    {
        builder.ToTable("MarriageBookings");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PartnerFullName).IsRequired().HasMaxLength(160);
        builder.Property(x => x.TrackingCode).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(x => x.TrackingCode).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class DocumentApplicationConfiguration : IEntityTypeConfiguration<DocumentApplication>
{
    public void Configure(EntityTypeBuilder<DocumentApplication> builder)
    {
        builder.ToTable("DocumentApplications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(40);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.TrackingCode).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.StaffNote).HasMaxLength(1000);
        builder.HasIndex(x => x.TrackingCode).IsUnique();
        builder.HasIndex(x => x.CitizenUserId);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class ContactMessageConfiguration : IEntityTypeConfiguration<ContactMessage>
{
    public void Configure(EntityTypeBuilder<ContactMessage> builder)
    {
        builder.ToTable("ContactMessages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Email).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Phone).HasMaxLength(40);
        builder.Property(x => x.Subject).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Body).IsRequired().HasMaxLength(4000);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class ZoningParcelConfiguration : IEntityTypeConfiguration<ZoningParcel>
{
    public void Configure(EntityTypeBuilder<ZoningParcel> builder)
    {
        builder.ToTable("ZoningParcels");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Ada).IsRequired().HasMaxLength(40);
        builder.Property(x => x.Parsel).IsRequired().HasMaxLength(40);
        builder.Property(x => x.NeighborhoodName).IsRequired().HasMaxLength(120);
        builder.Property(x => x.ZoningStatus).IsRequired().HasMaxLength(80);
        builder.Property(x => x.LandUse).IsRequired().HasMaxLength(120);
        builder.Property(x => x.AreaSqm).HasPrecision(12, 2);
        builder.Property(x => x.FeePerSqm).HasPrecision(12, 2);
        builder.HasIndex(x => new { x.Ada, x.Parsel }).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
