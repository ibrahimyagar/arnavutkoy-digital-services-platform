using ArnavutkoyBelediyesi.Domain.Announcements;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Hr;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Persistence.Seed;

/// <summary>
/// Uygulama ilk kez ayağa kalktığında rolleri, kurgusal demo kullanıcılarını ve referans
/// verilerini (coğrafi bilgi, talep kategorileri) oluşturan seed işlemleri.
/// Hiçbir gerçek vatandaş verisi içermez; tüm kullanıcı/borç/talep verileri kurgusaldır
/// (bkz. ASSUMPTIONS.md → A9).
/// </summary>
public static class ApplicationDbContextSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        ILogger logger,
        CancellationToken cancellationToken = default)
    {
        await context.Database.MigrateAsync(cancellationToken).ConfigureAwait(false);

        await SeedRolesAsync(roleManager).ConfigureAwait(false);
        var citizenUserId = await SeedUsersAsync(userManager, logger).ConfigureAwait(false);
        var districtId = await SeedGeographyAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedRequestCategoriesAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedAnnouncementsAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedHrAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedDebtsAsync(context, citizenUserId, cancellationToken).ConfigureAwait(false);

        _ = districtId;
    }

    private static async Task SeedRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var roleName in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName).ConfigureAwait(false))
            {
                await roleManager.CreateAsync(new ApplicationRole(roleName)).ConfigureAwait(false);
            }
        }
    }

    private static async Task<Guid> SeedUsersAsync(UserManager<ApplicationUser> userManager, ILogger logger)
    {
        var citizenUser = await CreateDemoUserIfNotExistsAsync(
            userManager, logger,
            nationalId: "10000000146",
            fullName: "Ayşe Demo Vatandaş",
            phoneNumber: "+905000000001",
            password: "Demo!Citizen123",
            role: Roles.Citizen);

        await CreateDemoUserIfNotExistsAsync(
            userManager, logger,
            nationalId: "10000000252",
            fullName: "Mehmet Demo Görevli",
            phoneNumber: "+905000000002",
            password: "Demo!Officer123",
            role: Roles.Officer);

        await CreateDemoUserIfNotExistsAsync(
            userManager, logger,
            nationalId: "10000000368",
            fullName: "Zeynep Demo Yönetici",
            phoneNumber: "+905000000003",
            password: "Demo!Admin123",
            role: Roles.Administrator);

        return citizenUser;
    }

    private static async Task<Guid> CreateDemoUserIfNotExistsAsync(
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        string nationalId,
        string fullName,
        string phoneNumber,
        string password,
        string role)
    {
        var existing = await userManager.FindByNameAsync(nationalId).ConfigureAwait(false);
        if (existing is not null)
        {
            return existing.Id;
        }

        var user = new ApplicationUser
        {
            UserName = nationalId,
            FullName = fullName,
            PhoneNumber = phoneNumber,
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password).ConfigureAwait(false);
        if (!createResult.Succeeded)
        {
            logger.LogWarning(
                "Demo kullanıcı '{NationalId}' oluşturulamadı: {Errors}",
                nationalId,
                string.Join(", ", createResult.Errors.Select(e => e.Description)));
            return Guid.Empty;
        }

        await userManager.AddToRoleAsync(user, role).ConfigureAwait(false);
        return user.Id;
    }

    private static async Task<Guid> SeedGeographyAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var existingDistrict = await context.Districts
            .FirstOrDefaultAsync(d => d.Name == "Arnavutköy", cancellationToken)
            .ConfigureAwait(false);

        if (existingDistrict is not null)
        {
            await EnsureDemoStreetsAsync(context, cancellationToken).ConfigureAwait(false);
            return existingDistrict.Id;
        }

        var district = District.Create("Arnavutköy");
        await context.Districts.AddAsync(district, cancellationToken).ConfigureAwait(false);

        var neighborhoods = new[]
        {
            Neighborhood.Create(district.Id, "Hadımköy", "Demo Muhtar 1", "+905001110001", 12500),
            Neighborhood.Create(district.Id, "Taşoluk", "Demo Muhtar 2", "+905001110002", 9800),
            Neighborhood.Create(district.Id, "Boğazköy", "Demo Muhtar 3", "+905001110003", 15200),
            Neighborhood.Create(district.Id, "Yeşilbayır", "Demo Muhtar 4", "+905001110004", 7600)
        };

        await context.Neighborhoods.AddRangeAsync(neighborhoods, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        await SeedDemoStreetsForNeighborhoodsAsync(context, neighborhoods.Select(n => n.Id).ToArray(), cancellationToken)
            .ConfigureAwait(false);

        return district.Id;
    }

    private static async Task EnsureDemoStreetsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.Streets.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var neighborhoodIds = await context.Neighborhoods
            .OrderBy(n => n.Name)
            .Select(n => n.Id)
            .Take(4)
            .ToArrayAsync(cancellationToken)
            .ConfigureAwait(false);

        if (neighborhoodIds.Length == 0)
        {
            return;
        }

        await SeedDemoStreetsForNeighborhoodsAsync(context, neighborhoodIds, cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedDemoStreetsForNeighborhoodsAsync(
        ApplicationDbContext context,
        Guid[] neighborhoodIds,
        CancellationToken cancellationToken)
    {
        if (neighborhoodIds.Length == 0)
        {
            return;
        }

        var streets = new List<Street>
        {
            Street.Create(neighborhoodIds[0], "Atatürk Caddesi"),
            Street.Create(neighborhoodIds[0], "Cumhuriyet Sokak")
        };

        if (neighborhoodIds.Length > 1)
        {
            streets.Add(Street.Create(neighborhoodIds[1], "İstiklal Caddesi"));
        }

        if (neighborhoodIds.Length > 2)
        {
            streets.Add(Street.Create(neighborhoodIds[2], "Fatih Sokak"));
        }

        if (neighborhoodIds.Length > 3)
        {
            streets.Add(Street.Create(neighborhoodIds[3], "Yeşilbayır Bulvarı"));
        }

        await context.Streets.AddRangeAsync(streets, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedRequestCategoriesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.RequestCategories.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var categories = new[]
        {
            RequestCategory.Create("Altyapı Arızası"),
            RequestCategory.Create("Temizlik"),
            RequestCategory.Create("Gürültü Şikayeti"),
            RequestCategory.Create("Yol Bakımı"),
            RequestCategory.Create("Diğer")
        };

        await context.RequestCategories.AddRangeAsync(categories, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedAnnouncementsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.Announcements.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var welcome = Announcement.CreateDraft(
            "Dijital Hizmetler Platformu Yayında",
            "Arnavutköy Belediyesi örnek dijital hizmetler platformu artık kurgusal demo verilerle kullanıma açıktır.",
            publishEndUtc: null);
        welcome.Publish(DateTime.UtcNow);

        var maintenance = Announcement.CreateDraft(
            "Planlı Bakım Duyurusu",
            "Sistem, bu hafta sonu planlı bakım nedeniyle kısa süreli erişime kapatılabilir.",
            publishEndUtc: DateTime.UtcNow.AddMonths(1));
        maintenance.Publish(DateTime.UtcNow);

        await context.Announcements.AddRangeAsync([welcome, maintenance], cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedHrAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.Departments.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var fen = Department.Create("Fen İşleri", "Yol, kaldırım ve altyapı bakımı");
        var temiz = Department.Create("Temizlik İşleri", "Cadde ve park temizliği");
        var basvuru = Department.Create("Başvuru ve Hizmet Masası", "Vatandaş talepleri ve yönlendirme");

        await context.Departments.AddRangeAsync([fen, temiz, basvuru], cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var staff = new[]
        {
            StaffMember.Create(fen.Id, "Demo Fen Müdürü", "Müdür", "fen@demo.arnavutkoy.local", "+905009990001"),
            StaffMember.Create(temiz.Id, "Demo Temizlik Şefi", "Şef", "temizlik@demo.arnavutkoy.local", "+905009990002"),
            StaffMember.Create(basvuru.Id, "Demo Hizmet Danışmanı", "Danışman", "hizmet@demo.arnavutkoy.local", "+905009990003")
        };

        await context.StaffMembers.AddRangeAsync(staff, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedDebtsAsync(ApplicationDbContext context, Guid citizenUserId, CancellationToken cancellationToken)
    {
        if (citizenUserId == Guid.Empty || await context.Debts.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            return;
        }

        var debts = new[]
        {
            Debt.Create(citizenUserId, DebtType.Water, 245.50m, DateTime.UtcNow.AddDays(-10)),
            Debt.Create(citizenUserId, DebtType.Property, 1780.00m, DateTime.UtcNow.AddDays(20))
        };

        await context.Debts.AddRangeAsync(debts, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
