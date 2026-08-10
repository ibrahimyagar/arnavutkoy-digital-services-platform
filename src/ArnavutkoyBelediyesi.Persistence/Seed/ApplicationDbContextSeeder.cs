using ArnavutkoyBelediyesi.Domain.Announcements;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.EServices;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Hr;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.Portal;
using ArnavutkoyBelediyesi.Domain.Properties;
using ArnavutkoyBelediyesi.Domain.Transportation;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Persistence.Seed;

/// <summary>
/// Roller, demo kullanıcılar ve Arnavutköy temalı referans verileri. Tüm vatandaş verileri kurgusaldır.
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
        await SeedGeographyAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedRequestCategoriesAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedAnnouncementsAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedHrAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedTransportationAsync(context, cancellationToken).ConfigureAwait(false);
        await SeedCitizenDemoAssetsAsync(context, citizenUserId, cancellationToken).ConfigureAwait(false);
        await SeedDebtsAsync(context, citizenUserId, cancellationToken).ConfigureAwait(false);
        await SeedPortalAndEServicesAsync(context, cancellationToken).ConfigureAwait(false);
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
        var citizenUser = await UpsertDemoUserAsync(
            userManager, logger,
            email: "vatandas@demo.arnavutkoy.local",
            legacyUserName: "10000000146",
            nationalId: "10000000146",
            fullName: "Ayşe Demo Vatandaş",
            phoneNumber: "+905000000001",
            birthDate: new DateOnly(1992, 4, 12),
            gender: "K",
            password: "Demo!Citizen123",
            role: Roles.Citizen);

        await UpsertDemoUserAsync(
            userManager, logger,
            email: "gorevli@demo.arnavutkoy.local",
            legacyUserName: "10000000252",
            nationalId: "10000000252",
            fullName: "Mehmet Demo Görevli",
            phoneNumber: "+905000000002",
            birthDate: new DateOnly(1985, 9, 21),
            gender: "E",
            password: "Demo!Officer123",
            role: Roles.Officer);

        await UpsertDemoUserAsync(
            userManager, logger,
            email: "yonetici@demo.arnavutkoy.local",
            legacyUserName: "10000000368",
            nationalId: "10000000368",
            fullName: "Zeynep Demo Yönetici",
            phoneNumber: "+905000000003",
            birthDate: new DateOnly(1988, 11, 3),
            gender: "K",
            password: "Demo!Admin123",
            role: Roles.Administrator);

        return citizenUser;
    }

    private static async Task<Guid> UpsertDemoUserAsync(
        UserManager<ApplicationUser> userManager,
        ILogger logger,
        string email,
        string legacyUserName,
        string nationalId,
        string fullName,
        string phoneNumber,
        DateOnly birthDate,
        string gender,
        string password,
        string role)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var existing =
            await userManager.FindByEmailAsync(normalizedEmail).ConfigureAwait(false)
            ?? await userManager.FindByNameAsync(normalizedEmail).ConfigureAwait(false)
            ?? await userManager.FindByNameAsync(legacyUserName).ConfigureAwait(false);

        if (existing is not null)
        {
            existing.Email = normalizedEmail;
            existing.UserName = normalizedEmail;
            existing.NormalizedEmail = normalizedEmail.ToUpperInvariant();
            existing.NormalizedUserName = normalizedEmail.ToUpperInvariant();
            existing.NationalId = string.IsNullOrWhiteSpace(existing.NationalId) ? nationalId : existing.NationalId;
            existing.FullName = fullName;
            existing.PhoneNumber = phoneNumber;
            existing.BirthDate ??= birthDate;
            if (string.IsNullOrWhiteSpace(existing.Gender))
            {
                existing.Gender = gender;
            }

            existing.EmailConfirmed = true;

            var update = await userManager.UpdateAsync(existing).ConfigureAwait(false);
            if (!update.Succeeded)
            {
                logger.LogWarning(
                    "Demo kullanıcı '{Email}' güncellenemedi: {Errors}",
                    email,
                    string.Join(", ", update.Errors.Select(e => e.Description)));
            }

            return existing.Id;
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            FullName = fullName,
            NationalId = nationalId,
            PhoneNumber = phoneNumber,
            BirthDate = birthDate,
            Gender = gender,
            EmailConfirmed = true,
            PhoneNumberConfirmed = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        var createResult = await userManager.CreateAsync(user, password).ConfigureAwait(false);
        if (!createResult.Succeeded)
        {
            logger.LogWarning(
                "Demo kullanıcı '{Email}' oluşturulamadı: {Errors}",
                email,
                string.Join(", ", createResult.Errors.Select(e => e.Description)));
            return Guid.Empty;
        }

        await userManager.AddToRoleAsync(user, role).ConfigureAwait(false);
        return user.Id;
    }

    private static readonly (string Name, string Headman, string Phone, int Population)[] ArnavutkoyNeighborhoods =
    [
        ("Adnan Menderes", "Demo Muhtar Adnan", "+905001110101", 14200),
        ("Anadolu", "Demo Muhtar Anadolu", "+905001110102", 9800),
        ("Arnavutköy Merkez", "Demo Muhtar Merkez", "+905001110103", 18500),
        ("Atatürk", "Demo Muhtar Atatürk", "+905001110104", 12100),
        ("Baklalı", "Demo Muhtar Baklalı", "+905001110105", 4200),
        ("Balaban", "Demo Muhtar Balaban", "+905001110106", 3100),
        ("Boğazköy İstiklal", "Demo Muhtar Boğazköy", "+905001110107", 15600),
        ("Bolluca", "Demo Muhtar Bolluca", "+905001110108", 8700),
        ("Boyalık", "Demo Muhtar Boyalık", "+905001110109", 2900),
        ("Çilingir", "Demo Muhtar Çilingir", "+905001110110", 5400),
        ("Deliklikaya", "Demo Muhtar Deliklikaya", "+905001110111", 3600),
        ("Dursunköy", "Demo Muhtar Dursunköy", "+905001110112", 2800),
        ("Durusu", "Demo Muhtar Durusu", "+905001110113", 6100),
        ("Fatih", "Demo Muhtar Fatih", "+905001110114", 11200),
        ("Hacımaşlı", "Demo Muhtar Hacımaşlı", "+905001110115", 2500),
        ("Hadımköy", "Demo Muhtar Hadımköy", "+905001110116", 23500),
        ("Haraççı", "Demo Muhtar Haraççı", "+905001110117", 7300),
        ("Hastane", "Demo Muhtar Hastane", "+905001110118", 9100),
        ("Hicret", "Demo Muhtar Hicret", "+905001110119", 6800),
        ("İmrahor", "Demo Muhtar İmrahor", "+905001110120", 4700),
        ("İslambey", "Demo Muhtar İslambey", "+905001110121", 8900),
        ("Karaburun", "Demo Muhtar Karaburun", "+905001110122", 3300),
        ("Karlıbayır", "Demo Muhtar Karlıbayır", "+905001110123", 7600),
        ("Mareşal Fevzi Çakmak", "Demo Muhtar Mareşal", "+905001110124", 10400),
        ("Mavigöl", "Demo Muhtar Mavigöl", "+905001110125", 5200),
        ("Mehmet Akif Ersoy", "Demo Muhtar Mehmet Akif", "+905001110126", 9700),
        ("Mustafa Kemal Paşa", "Demo Muhtar Mustafa Kemal", "+905001110127", 11800),
        ("Nenehatun", "Demo Muhtar Nenehatun", "+905001110128", 6400),
        ("Ömerli", "Demo Muhtar Ömerli", "+905001110129", 4100),
        ("Sazlıbosna", "Demo Muhtar Sazlıbosna", "+905001110130", 5800),
        ("Taşoluk", "Demo Muhtar Taşoluk", "+905001110131", 16200),
        ("Tayakadın", "Demo Muhtar Tayakadın", "+905001110132", 3900),
        ("Terkos", "Demo Muhtar Terkos", "+905001110133", 2700),
        ("Yassıören", "Demo Muhtar Yassıören", "+905001110134", 3400),
        ("Yavuz Selim", "Demo Muhtar Yavuz Selim", "+905001110135", 8300),
        ("Yeniköy", "Demo Muhtar Yeniköy", "+905001110136", 4500),
        ("Yeşilbayır", "Demo Muhtar Yeşilbayır", "+905001110137", 7900),
        ("Yunus Emre", "Demo Muhtar Yunus Emre", "+905001110138", 9200),
    ];

    private static async Task SeedGeographyAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var district = await context.Districts
            .FirstOrDefaultAsync(d => d.Name == "Arnavutköy", cancellationToken)
            .ConfigureAwait(false);

        if (district is null)
        {
            district = District.Create("Arnavutköy");
            await context.Districts.AddAsync(district, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        var existingNames = await context.Neighborhoods
            .Where(n => n.DistrictId == district.Id)
            .Select(n => n.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var existingSet = existingNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var toAdd = ArnavutkoyNeighborhoods
            .Where(n => !existingSet.Contains(n.Name))
            .Select(n => Neighborhood.Create(district.Id, n.Name, n.Headman, n.Phone, n.Population))
            .ToArray();

        if (toAdd.Length > 0)
        {
            await context.Neighborhoods.AddRangeAsync(toAdd, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        await EnsureDemoStreetsAsync(context, cancellationToken).ConfigureAwait(false);
    }

    private static async Task EnsureDemoStreetsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var named = new (string Neighborhood, string[] Streets)[]
        {
            ("Hadımköy", ["Hadımköy Caddesi", "Lojistik Bulvarı", "Sanayi Sokak"]),
            ("Taşoluk", ["Taşoluk Meydanı", "İstanbul Caddesi", "Kavşak Sokak"]),
            ("Arnavutköy Merkez", ["Belediye Caddesi", "Cumhuriyet Meydanı", "Çarşı Sokak"]),
            ("Boğazköy İstiklal", ["İstiklal Caddesi", "Boğazköy Park Yolu"]),
            ("Yeşilbayır", ["Yeşilbayır Bulvarı", "Orman Sokak"]),
            ("Durusu", ["Durusu Göl Yolu", "Karadeniz Caddesi"]),
            ("Terkos", ["Terkos Sahil Yolu"]),
            ("Sazlıbosna", ["Sazlıbosna Köy Yolu"]),
        };

        foreach (var (neighborhoodName, streets) in named)
        {
            var neighborhood = await context.Neighborhoods
                .FirstOrDefaultAsync(n => n.Name == neighborhoodName, cancellationToken)
                .ConfigureAwait(false);
            if (neighborhood is null)
            {
                continue;
            }

            var existingStreetNames = await context.Streets
                .Where(s => s.NeighborhoodId == neighborhood.Id)
                .Select(s => s.Name)
                .ToListAsync(cancellationToken)
                .ConfigureAwait(false);

            var set = existingStreetNames.ToHashSet(StringComparer.OrdinalIgnoreCase);
            var add = streets
                .Where(s => !set.Contains(s))
                .Select(s => Street.Create(neighborhood.Id, s))
                .ToArray();

            if (add.Length > 0)
            {
                await context.Streets.AddRangeAsync(add, cancellationToken).ConfigureAwait(false);
            }
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedRequestCategoriesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var desired = new[]
        {
            "Altyapı Arızası",
            "Temizlik",
            "Gürültü Şikayeti",
            "Yol Bakımı",
            "Park ve Bahçeler",
            "Aydınlatma",
            "Hayvan Toplama",
            "İmar / Ruhsat Bilgi",
            "Diğer",
        };

        var existing = await context.RequestCategories
            .Select(c => c.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var set = existing.ToHashSet(StringComparer.OrdinalIgnoreCase);
        var add = desired
            .Where(name => !set.Contains(name))
            .Select(RequestCategory.Create)
            .ToArray();

        if (add.Length == 0)
        {
            return;
        }

        await context.RequestCategories.AddRangeAsync(add, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedAnnouncementsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (await context.Announcements.CountAsync(cancellationToken).ConfigureAwait(false) >= 5)
        {
            return;
        }

        if (await context.Announcements.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            // Eski 2 duyuru varsa yenilerini ekle
        }

        var existingTitles = await context.Announcements
            .Select(a => a.Title)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var titleSet = existingTitles.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var drafts = new (string Title, string Body, DateTime? End)[]
        {
            (
                "Dijital Hizmetler Platformu Yayında",
                "Arnavutköy örnek dijital hizmetler platformu kurgusal demo verilerle kullanıma açıktır. Gerçek belediye işlemi değildir.",
                null),
            (
                "Hadımköy Lojistik Bölgesi Yol Çalışması",
                "Hadımköy Caddesi üzerinde planlı yol bakımı nedeniyle 36AS hattında geçici güzergâh değişikliği uygulanabilir.",
                DateTime.UtcNow.AddMonths(1)),
            (
                "Durusu ve Terkos Sahil Temizlik Seferberliği",
                "Durusu Gölü ve Terkos sahil bandında temizlik ve bilgilendirme çalışmaları yapılacaktır.",
                DateTime.UtcNow.AddMonths(2)),
            (
                "Taşoluk Sosyal Yardım Başvuru Günleri",
                "Taşoluk ve çevresi için sosyal yardım ön başvuruları dijital kanaldan alınmaktadır (demo).",
                DateTime.UtcNow.AddDays(45)),
            (
                "Arnavutköy Merkez Çarşı Aydınlatma Yenilemesi",
                "Merkez mahalle çarşı bölgesinde LED aydınlatma yenileme programı başlatılmıştır.",
                DateTime.UtcNow.AddMonths(3)),
            (
                "Planlı Bakım Duyurusu",
                "Sistem, bu hafta sonu planlı bakım nedeniyle kısa süreli erişime kapatılabilir.",
                DateTime.UtcNow.AddMonths(1)),
        };

        var toPublish = new List<Announcement>();
        foreach (var (title, body, end) in drafts)
        {
            if (titleSet.Contains(title))
            {
                continue;
            }

            var draft = Announcement.CreateDraft(title, body, end);
            draft.Publish(DateTime.UtcNow);
            toPublish.Add(draft);
        }

        if (toPublish.Count == 0)
        {
            return;
        }

        await context.Announcements.AddRangeAsync(toPublish, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedHrAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var desiredDepartments = new (string Name, string Description)[]
        {
            ("Fen İşleri", "Yol, kaldırım ve altyapı bakımı"),
            ("Temizlik İşleri", "Cadde, park ve sahil temizliği"),
            ("Başvuru ve Hizmet Masası", "Vatandaş talepleri ve yönlendirme"),
            ("Zabıta Müdürlüğü", "Denetim ve kamu düzeni (demo)"),
            ("Park ve Bahçeler", "Yeşil alan ve ağaçlandırma"),
            ("Su ve Kanalizasyon Koordinasyon", "Abonelik ve arıza yönlendirme"),
            ("Sosyal Destek Hizmetleri", "Sosyal yardım başvuruları"),
            ("Ulaşım ve Trafik", "Hat bilgilendirme ve durak düzeni"),
        };

        var existingDeptNames = await context.Departments
            .Select(d => d.Name)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var deptSet = existingDeptNames.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newDepts = desiredDepartments
            .Where(d => !deptSet.Contains(d.Name))
            .Select(d => Department.Create(d.Name, d.Description))
            .ToArray();

        if (newDepts.Length > 0)
        {
            await context.Departments.AddRangeAsync(newDepts, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (await context.StaffMembers.CountAsync(cancellationToken).ConfigureAwait(false) >= 8)
        {
            return;
        }

        var departments = await context.Departments.ToListAsync(cancellationToken).ConfigureAwait(false);
        Department? Find(string name) =>
            departments.FirstOrDefault(d => d.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        var staffCandidates = new (string Dept, string FullName, string Title, string Email, string Phone)[]
        {
            ("Fen İşleri", "Demo Fen Müdürü", "Müdür", "fen@demo.arnavutkoy.local", "+905009990001"),
            ("Temizlik İşleri", "Demo Temizlik Şefi", "Şef", "temizlik@demo.arnavutkoy.local", "+905009990002"),
            ("Başvuru ve Hizmet Masası", "Demo Hizmet Danışmanı", "Danışman", "hizmet@demo.arnavutkoy.local", "+905009990003"),
            ("Zabıta Müdürlüğü", "Demo Zabıta Amiri", "Amir", "zabita@demo.arnavutkoy.local", "+905009990004"),
            ("Park ve Bahçeler", "Demo Park Sorumlusu", "Uzman", "park@demo.arnavutkoy.local", "+905009990005"),
            ("Su ve Kanalizasyon Koordinasyon", "Demo Su Koordinatörü", "Koordinatör", "su@demo.arnavutkoy.local", "+905009990006"),
            ("Sosyal Destek Hizmetleri", "Demo Sosyal Çalışmacı", "Uzman", "sosyal@demo.arnavutkoy.local", "+905009990007"),
            ("Ulaşım ve Trafik", "Demo Ulaşım Planlamacı", "Planlamacı", "ulasim@demo.arnavutkoy.local", "+905009990008"),
        };

        var existingEmails = await context.StaffMembers
            .Select(s => s.Email)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var emailSet = existingEmails.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var addStaff = new List<StaffMember>();
        foreach (var candidate in staffCandidates)
        {
            if (emailSet.Contains(candidate.Email))
            {
                continue;
            }

            var dept = Find(candidate.Dept);
            if (dept is null)
            {
                continue;
            }

            addStaff.Add(StaffMember.Create(dept.Id, candidate.FullName, candidate.Title, candidate.Email, candidate.Phone));
        }

        if (addStaff.Count == 0)
        {
            return;
        }

        await context.StaffMembers.AddRangeAsync(addStaff, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedTransportationAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var desiredLines = new (string Code, string Name, string Route, decimal Fare)[]
        {
            ("36AS", "Hadımköy - Metro", "Hadımköy → Taşoluk → Metro aktarma", 17.50m),
            ("336", "Boğazköy Ring", "Boğazköy İstiklal ring", 12.00m),
            ("78YB", "Yeşilbayır Express", "Yeşilbayır → Arnavutköy Merkez", 15.00m),
            ("336A", "Durusu - Merkez", "Durusu → Terkos → Arnavutköy Merkez", 18.00m),
            ("MK22", "Sazlıbosna - Hadımköy", "Sazlıbosna → Hadımköy Sanayi", 14.00m),
            ("AK1", "Merkez İç Hat", "Arnavutköy Merkez çarşı ring", 10.00m),
        };

        var existingCodes = await context.BusLines
            .Select(l => l.Code)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var codeSet = existingCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);

        var newLines = desiredLines
            .Where(l => !codeSet.Contains(l.Code))
            .Select(l => BusLine.Create(l.Code, l.Name, l.Route, l.Fare))
            .ToArray();

        if (newLines.Length > 0)
        {
            await context.BusLines.AddRangeAsync(newLines, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        await EnsureLineScheduleAsync(context, "36AS",
            ["Hadımköy Merkez", "Taşoluk Kavşağı", "Hastane", "Metro Aktarma"],
            cancellationToken).ConfigureAwait(false);

        await EnsureLineScheduleAsync(context, "336A",
            ["Durusu", "Terkos", "Karaburun", "Arnavutköy Merkez"],
            cancellationToken).ConfigureAwait(false);

        await EnsureLineScheduleAsync(context, "AK1",
            ["Belediye Önü", "Çarşı", "Cumhuriyet Meydanı", "Belediye Önü"],
            cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedCitizenDemoAssetsAsync(
        ApplicationDbContext context,
        Guid citizenUserId,
        CancellationToken cancellationToken)
    {
        if (citizenUserId == Guid.Empty)
        {
            return;
        }

        // Idempotent: card number is globally unique; skip if this citizen already has a card
        // or if the demo number was issued to a previous seed user id.
        var hasCard = await context.TransportCards
            .AnyAsync(
                c => c.OwnerUserId == citizenUserId || c.CardNumber == "AK-34-1001",
                cancellationToken)
            .ConfigureAwait(false);
        if (!hasCard)
        {
            await context.TransportCards
                .AddAsync(TransportCard.Issue(citizenUserId, "AK-34-1001", 120m), cancellationToken)
                .ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        var hasProperty = await context.CitizenProperties
            .AnyAsync(p => p.OwnerUserId == citizenUserId, cancellationToken)
            .ConfigureAwait(false);
        if (!hasProperty)
        {
            var neighborhood = await context.Neighborhoods
                .FirstOrDefaultAsync(n => n.Name == "Hadımköy", cancellationToken)
                .ConfigureAwait(false)
                ?? await context.Neighborhoods.FirstOrDefaultAsync(cancellationToken).ConfigureAwait(false);

            if (neighborhood is not null)
            {
                var street = await context.Streets
                    .FirstOrDefaultAsync(s => s.NeighborhoodId == neighborhood.Id, cancellationToken)
                    .ConfigureAwait(false);

                var property = CitizenProperty.Create(
                    citizenUserId,
                    neighborhood.Id,
                    street?.Id,
                    PropertyType.Residential,
                    "Demo Konut — Hadımköy",
                    "12",
                    "Ada 45 / Parsel 8");

                await context.CitizenProperties.AddAsync(property, cancellationToken).ConfigureAwait(false);
                await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

                await EnsureDemoWaterSubscriptionAsync(
                        context,
                        citizenUserId,
                        neighborhood.Id,
                        property.Id,
                        cancellationToken)
                    .ConfigureAwait(false);
            }
        }
        else
        {
            var property = await context.CitizenProperties
                .FirstAsync(p => p.OwnerUserId == citizenUserId, cancellationToken)
                .ConfigureAwait(false);
            await EnsureDemoWaterSubscriptionAsync(
                    context,
                    citizenUserId,
                    property.NeighborhoodId,
                    property.Id,
                    cancellationToken)
                .ConfigureAwait(false);
        }
    }

    private static async Task EnsureDemoWaterSubscriptionAsync(
        ApplicationDbContext context,
        Guid citizenUserId,
        Guid neighborhoodId,
        Guid propertyId,
        CancellationToken cancellationToken)
    {
        var hasWater = await context.WaterSubscriptions
            .AnyAsync(
                w => w.SubscriberUserId == citizenUserId || w.SubscriptionNumber == "AK-SU-1001",
                cancellationToken)
            .ConfigureAwait(false);
        if (hasWater)
        {
            return;
        }

        await context.WaterSubscriptions
            .AddAsync(
                WaterSubscription.Open(
                    citizenUserId,
                    neighborhoodId,
                    propertyId,
                    "AK-SU-1001",
                    DateTime.UtcNow.AddMonths(-8)),
                cancellationToken)
            .ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task EnsureLineScheduleAsync(
        ApplicationDbContext context,
        string code,
        string[] stopNames,
        CancellationToken cancellationToken)
    {
        var line = await context.BusLines
            .FirstOrDefaultAsync(l => l.Code == code, cancellationToken)
            .ConfigureAwait(false);
        if (line is null)
        {
            return;
        }

        var hasStops = await context.BusLineStops
            .AnyAsync(s => s.BusLineId == line.Id, cancellationToken)
            .ConfigureAwait(false);
        if (!hasStops)
        {
            var stops = stopNames
                .Select((name, index) => BusLineStop.Create(line.Id, index + 1, name))
                .ToArray();
            await context.BusLineStops.AddRangeAsync(stops, cancellationToken).ConfigureAwait(false);
        }

        var hasDepartures = await context.BusLineDepartures
            .AnyAsync(d => d.BusLineId == line.Id, cancellationToken)
            .ConfigureAwait(false);
        if (!hasDepartures)
        {
            var departures = new[]
            {
                BusLineDeparture.Create(line.Id, DayOfWeek.Monday, new TimeOnly(7, 0), "İş saati"),
                BusLineDeparture.Create(line.Id, DayOfWeek.Monday, new TimeOnly(8, 30), null),
                BusLineDeparture.Create(line.Id, DayOfWeek.Monday, new TimeOnly(17, 15), "Akşam"),
                BusLineDeparture.Create(line.Id, DayOfWeek.Saturday, new TimeOnly(10, 0), "Hafta sonu"),
                BusLineDeparture.Create(line.Id, DayOfWeek.Sunday, new TimeOnly(11, 30), "Hafta sonu"),
            };
            await context.BusLineDepartures.AddRangeAsync(departures, cancellationToken).ConfigureAwait(false);
        }

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
            Debt.Create(citizenUserId, DebtType.Property, 1780.00m, DateTime.UtcNow.AddDays(20)),
            Debt.Create(citizenUserId, DebtType.Water, 89.75m, DateTime.UtcNow.AddDays(-40)),
        };

        await context.Debts.AddRangeAsync(debts, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedPortalAndEServicesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        if (!await context.PortalContents.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            var now = DateTime.UtcNow;
            var contents = new[]
            {
                PortalContent.Create(PortalContentKind.Mayor, "Başkanın mesajı", "Demo portföy — kurgusal başkan mesajı.",
                    "Arnavutköy’de dijital hizmetleri tek portalda sunmak için bu örnek platform geliştirildi. Tüm içerikler kurgusaldır; resmi kurumla bağlantısı yoktur.",
                    "baskan-mesaji", category: "Kurumsal", sortOrder: 1),
                PortalContent.Create(PortalContentKind.Corporate, "Kurumsal yapı", "Organizasyon ve birimler.",
                    "Belediye hizmetleri; mali hizmetler, fen işleri, kültür, sosyal destek ve ulaşım birimleri üzerinden kurgusal olarak sunulur.",
                    "kurumsal-yapi", category: "Kurumsal", sortOrder: 1),
                PortalContent.Create(PortalContentKind.News, "Hadımköy’de yol iyileştirme tamamlandı", "Demo haber — altyapı.",
                    "Hadımköy sanayi aksında kurgusal yol yenileme çalışması tamamlandı. Trafik düzeni güncellendi.",
                    "haber-hadimkoy-yol", category: "Altyapı", startsAtUtc: now.AddDays(-2), sortOrder: 1),
                PortalContent.Create(PortalContentKind.News, "Taşoluk’ta aile destek başvurusu", "Demo haber — sosyal destek.",
                    "Taşoluk sosyal yardım biriminde kurgusal başvuru günleri duyuruldu. Gerçek kurum duyurusu değildir.",
                    "haber-tasoluk-destek", category: "Sosyal", startsAtUtc: now.AddDays(-1), sortOrder: 2),
                PortalContent.Create(PortalContentKind.News, "Durusu sahil bandı temizlik seferberliği", "Demo haber — çevre.",
                    "Durusu ve Terkos hattında kurgusal temizlik etkinliği planlandı.",
                    "haber-durusu-temizlik", category: "Çevre", startsAtUtc: now.AddHours(-6), sortOrder: 3),
                PortalContent.Create(PortalContentKind.Event, "Açık hava sineması — Merkez Meydan", "Kültür etkinliği (demo).",
                    "Merkez meydanda kurgusal açık hava sineması. Bilet gerekmez; portföy demosudur.",
                    "etkinlik-sinema", location: "Arnavutköy Merkez", category: "Kültür",
                    startsAtUtc: now.AddDays(5).Date.AddHours(19), endsAtUtc: now.AddDays(5).Date.AddHours(22), sortOrder: 1),
                PortalContent.Create(PortalContentKind.Event, "Gençlik koşusu — Boğazköy", "Spor etkinliği (demo).",
                    "Boğazköy parkuru üzerinde 5 km kurgusal koşu. Kayıt spor randevu modülünden yapılabilir.",
                    "etkinlik-kosu", location: "Boğazköy", category: "Spor",
                    startsAtUtc: now.AddDays(12).Date.AddHours(9), endsAtUtc: now.AddDays(12).Date.AddHours(12), sortOrder: 2),
                PortalContent.Create(PortalContentKind.Project, "Yeşilbayır park yenileme", "Faaliyet / proje (demo).",
                    "Yeşilbayır mahallesinde kurgusal park yenileme projesi. İlerleme oranı demo veridir.",
                    "faaliyet-yesilbayir-park", location: "Yeşilbayır", category: "Park", sortOrder: 1),
                PortalContent.Create(PortalContentKind.Project, "Hadımköy bisiklet yolu", "Faaliyet / proje (demo).",
                    "Hadımköy–Taşoluk aksında kurgusal bisiklet yolu etüdü.",
                    "faaliyet-bisiklet", location: "Hadımköy", category: "Ulaşım", sortOrder: 2),
                PortalContent.Create(PortalContentKind.CultureVenue, "Arnavutköy Kültür Merkezi", "Kültür tesisi (demo).",
                    "Konferans salonu, sergi alanı ve kurs odaları. Rezervasyon için iletişime geçin (demo).",
                    "kultur-merkezi", location: "Merkez", category: "Tesis", sortOrder: 1),
                PortalContent.Create(PortalContentKind.CultureVenue, "Durusu Sahil Amfisi", "Açık hava alanı (demo).",
                    "Yaz etkinlikleri için kurgusal amfi. Gerçek tesis bilgisi değildir.",
                    "durusu-amfi", location: "Durusu", category: "Tesis", sortOrder: 2),
                PortalContent.Create(PortalContentKind.ServiceGuide, "Vergi ödeme", "E-belediye vezne üzerinden.",
                    "Emlak ve su borçlarınızı dijital vezne ile ödeyin. Demo kart bilgisi kullanın.",
                    "rehber-vergi", category: "Mali", sortOrder: 1),
                PortalContent.Create(PortalContentKind.ServiceGuide, "İmar durumu sorgulama", "Ada/parsel ile sorgu.",
                    "Demo imar parselleri: 45/8 (Hadımköy), 12/3 (Merkez), 7/21 (Taşoluk).",
                    "rehber-imar", category: "İmar", sortOrder: 2),
                PortalContent.Create(PortalContentKind.ServiceGuide, "Nikah randevusu", "Salon ve saat seçimi.",
                    "Nikah salonlarında kurgusal kontenjan. Takip kodu ile durum sorgulanır.",
                    "rehber-nikah", category: "Nüfus", sortOrder: 3),
                PortalContent.Create(PortalContentKind.ServiceGuide, "Spor tesisi randevusu", "Halı saha ve salon.",
                    "Spor merkezlerinden saatlik randevu alın. Kapasite dolunca yeni slot seçin.",
                    "rehber-spor", category: "Spor", sortOrder: 4),
            };

            await context.PortalContents.AddRangeAsync(contents, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (!await context.SportsFacilities.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            await context.SportsFacilities.AddRangeAsync(
                [
                    SportsFacility.Create("Merkez Kapalı Spor Salonu", "Arnavutköy Merkez", "Basketbol", 12),
                    SportsFacility.Create("Hadımköy Halı Saha", "Hadımköy", "Futbol", 8),
                    SportsFacility.Create("Taşoluk Yüzme Havuzu", "Taşoluk", "Yüzme", 20),
                ],
                cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (!await context.MarriageSlots.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            var baseDay = DateTime.UtcNow.Date.AddDays(10);
            await context.MarriageSlots.AddRangeAsync(
                [
                    MarriageSlot.Create("Nikah Salonu A", baseDay.AddHours(10), 4),
                    MarriageSlot.Create("Nikah Salonu A", baseDay.AddHours(12), 4),
                    MarriageSlot.Create("Nikah Salonu B", baseDay.AddDays(2).AddHours(11), 3),
                    MarriageSlot.Create("Açık Hava Alanı", baseDay.AddDays(5).AddHours(16), 6),
                ],
                cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        if (!await context.ZoningParcels.AnyAsync(cancellationToken).ConfigureAwait(false))
        {
            await context.ZoningParcels.AddRangeAsync(
                [
                    ZoningParcel.Create("45", "8", "Hadımköy", "İmarlı", "Konut", 450m, 18.50m),
                    ZoningParcel.Create("12", "3", "Arnavutköy Merkez", "İmarlı", "Ticaret+Konut", 320m, 24.00m),
                    ZoningParcel.Create("7", "21", "Taşoluk", "Plan değişikliği sürecinde", "Konut", 600m, 15.75m),
                ],
                cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
    }
}
