using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ArnavutkoyBelediyesi.Persistence.Configurations;

public sealed class SocialAssistanceApplicationConfiguration : IEntityTypeConfiguration<SocialAssistanceApplication>
{
    public void Configure(EntityTypeBuilder<SocialAssistanceApplication> builder)
    {
        builder.ToTable("SocialAssistanceApplications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.HouseholdSummary).IsRequired().HasMaxLength(2000);
        builder.Property(x => x.ExtraFieldsJson).IsRequired().HasColumnType("jsonb");
        builder.Property(x => x.ReviewNote).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.MonthlyIncome).HasPrecision(12, 2);
        builder.Property(x => x.Type).HasConversion<string>().HasMaxLength(30);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(30);
        builder.HasIndex(x => x.ApplicantUserId);
        builder.HasIndex(x => x.Status);
        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
