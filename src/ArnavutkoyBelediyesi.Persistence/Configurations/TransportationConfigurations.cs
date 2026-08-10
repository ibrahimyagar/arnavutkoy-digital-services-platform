using ArnavutkoyBelediyesi.Domain.Transportation;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

public sealed class TransportCardConfiguration : IEntityTypeConfiguration<TransportCard>
{
    public void Configure(EntityTypeBuilder<TransportCard> builder)
    {
        builder.ToTable("TransportCards");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.CardNumber).IsRequired().HasMaxLength(30);
        builder.Property(x => x.Balance).HasPrecision(12, 2);
        builder.HasIndex(x => x.CardNumber).IsUnique();
        builder.HasIndex(x => x.OwnerUserId);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class BusLineConfiguration : IEntityTypeConfiguration<BusLine>
{
    public void Configure(EntityTypeBuilder<BusLine> builder)
    {
        builder.ToTable("BusLines");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).IsRequired().HasMaxLength(20);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.RouteSummary).IsRequired().HasMaxLength(500);
        builder.Property(x => x.BaseFare).HasPrecision(12, 2);
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}

public sealed class BoardingRecordConfiguration : IEntityTypeConfiguration<BoardingRecord>
{
    public void Configure(EntityTypeBuilder<BoardingRecord> builder)
    {
        builder.ToTable("BoardingRecords");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FareCharged).HasPrecision(12, 2);
        builder.HasIndex(x => x.TransportCardId);
        builder.HasIndex(x => x.BusLineId);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
