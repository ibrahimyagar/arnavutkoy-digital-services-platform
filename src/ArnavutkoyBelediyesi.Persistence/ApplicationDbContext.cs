using ArnavutkoyBelediyesi.Domain.Announcements;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Hr;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.Properties;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using ArnavutkoyBelediyesi.Domain.Transportation;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Persistence;

/// <summary>
/// Uygulamanın tek EF Core veritabanı bağlamı. ASP.NET Core Identity tablolarını ve tüm domain
/// aggregate'lerini barındırır. Entity konfigürasyonları <c>Configurations</c> klasöründeki
/// <see cref="Microsoft.EntityFrameworkCore.IEntityTypeConfiguration{TEntity}"/> sınıflarında
/// tanımlıdır; bu sınıf yalnızca <c>OnModelCreating</c> içinde bunları toplu uygular.
/// </summary>
public sealed class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<District> Districts => Set<District>();

    public DbSet<Neighborhood> Neighborhoods => Set<Neighborhood>();

    public DbSet<Street> Streets => Set<Street>();

    public DbSet<CitizenProperty> CitizenProperties => Set<CitizenProperty>();

    public DbSet<WaterSubscription> WaterSubscriptions => Set<WaterSubscription>();

    public DbSet<Department> Departments => Set<Department>();

    public DbSet<StaffMember> StaffMembers => Set<StaffMember>();

    public DbSet<SocialAssistanceApplication> SocialAssistanceApplications => Set<SocialAssistanceApplication>();

    public DbSet<TransportCard> TransportCards => Set<TransportCard>();

    public DbSet<BusLine> BusLines => Set<BusLine>();

    public DbSet<BoardingRecord> BoardingRecords => Set<BoardingRecord>();

    public DbSet<BusLineStop> BusLineStops => Set<BusLineStop>();

    public DbSet<BusLineDeparture> BusLineDepartures => Set<BusLineDeparture>();

    public DbSet<Announcement> Announcements => Set<Announcement>();

    public DbSet<RequestCategory> RequestCategories => Set<RequestCategory>();

    public DbSet<CitizenRequest> CitizenRequests => Set<CitizenRequest>();

    public DbSet<RequestMessage> RequestMessages => Set<RequestMessage>();

    public DbSet<Debt> Debts => Set<Debt>();

    public DbSet<Payment> Payments => Set<Payment>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
