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

    /// <summary>
    /// Mahalle nüfus yılı. 2026 ADNKS yayımlanınca bu sabit ve dizi güncellenir.
    /// Kaynak: TÜİK ADNKS 2025 (mahalle kırılımı nufusune.com ADNKS derlemesi).
    /// Muhtar/telefon: T.C. Arnavutköy Belediyesi — Muhtarlarımız e-Rehber (arnavutkoy.bel.tr/arnavutkoy-muhtarlari).
    /// Doğrulama: 2026-08-16. 38 mahalle toplamı = 358.469 = ADNKS 2025 ilçe nüfusu.
    /// </summary>
    private const int NeighborhoodPopulationYear = 2025;

    private static readonly (string Name, string Headman, string Phone, int Population)[] ArnavutkoyNeighborhoods =
    [
        ("Adnan Menderes", "Ercan İKA", "+905369690253", 4728),
        ("Anadolu", "Bayram DELİDUMAN", "+905373208098", 49342),
        ("Arnavutköy Merkez", "Ayşegül BAYBEK", "+905312516329", 23571),
        ("Atatürk", "Emrah ÖZKARACA", "+905392274082", 11063),
        ("Baklalı", "Zafer YÖRÜK", "+905368817233", 873),
        ("Balaban", "İlker YILMAZ", "+905325011776", 454),
        ("Boğazköy İstiklal", "Ersin ESENBOĞA", "+905321370323", 13133),
        ("Bolluca", "Murat TEPE", "+905323780329", 8496),
        ("Boyalık", "Tahsin ÖZDİL", "+905326367172", 856),
        ("Çilingir", "Halit ŞENEL", "+905323682709", 1174),
        ("Deliklikaya", "Mustafa BORÇLANMIŞ", "+905416390065", 8983),
        ("Dursunköy", "Sami TUNCEL", "+905334467940", 470),
        ("Durusu", "Ahmet HUNDİ", "+905343733392", 743),
        ("Fatih", "Adem AKGÜN", "+905413666134", 3995),
        ("Hacımaşlı", "Muzaffer ÖZKAN", "+905422571663", 693),
        ("Hadımköy", "Rıza DEMİRCİ", "+905359506271", 27984),
        ("Haraççı", "Ömer DOKAN", "+905355981244", 12042),
        ("Hastane", "Onur FIRINCI", "+905445467042", 11483),
        ("Hicret", "Ali GÖNDÜK", "+905363536259", 4454),
        ("İmrahor", "Mehmet Emin ERKİN", "+905424310574", 12184),
        ("İslambey", "Şahimerdan FİDANER", "+905359798167", 27838),
        ("Karaburun", "Mustafa KARAALİ", "+905363258158", 2018),
        ("Karlıbayır", "Ekrem YILMAZ", "+905359667394", 11576),
        ("Mareşal Fevzi Çakmak", "Zeki ERCİ", "+905324679934", 7423),
        ("Mavigöl", "Ercan KAHRIMAN", "+905356186152", 10633),
        ("Mehmet Akif Ersoy", "Mustafa KELEŞ", "+905517041282", 8132),
        ("Mustafa Kemal Paşa", "Cengiz GÜZEL", "+905435293600", 18855),
        ("Nenehatun", "Fuat YAŞKESEN", "+905414432646", 11868),
        ("Ömerli", "Dursun GÖKÇEKLİ", "+905325156175", 7619),
        ("Sazlıbosna", "Oktay TEKE", "+905323949458", 1096),
        ("Taşoluk", "Ercan KİRENCİ", "+905399483657", 12382),
        ("Tayakadın", "Solmaz BOZDEMİR", "+905327813544", 3688),
        ("Terkos", "Seyit VURGUN", "+905438725839", 933),
        ("Yassıören", "Abdulkadir ATAY", "+905438533737", 1057),
        ("Yavuz Selim", "Cemal TÜRKMEN", "+905352514079", 13655),
        ("Yeniköy", "Timur ÇEVİK", "+905061076666", 1585),
        ("Yeşilbayır", "Şener ENGİN", "+905324736915", 631),
        ("Yunus Emre", "Yunus BOZKURT", "+905356363215", 20759),
    ];

    private static async Task SeedGeographyAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        _ = NeighborhoodPopulationYear;

        var district = await context.Districts
            .FirstOrDefaultAsync(d => d.Name == "Arnavutköy", cancellationToken)
            .ConfigureAwait(false);

        if (district is null)
        {
            district = District.Create("Arnavutköy");
            await context.Districts.AddAsync(district, cancellationToken).ConfigureAwait(false);
            await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }

        var existing = await context.Neighborhoods
            .Where(n => n.DistrictId == district.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var byName = existing
            .GroupBy(n => n.Name, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        foreach (var draft in ArnavutkoyNeighborhoods)
        {
            if (byName.TryGetValue(draft.Name, out var row))
            {
                row.UpdateHeadman(draft.Headman, draft.Phone);
                row.UpdatePopulation(draft.Population);
                continue;
            }

            await context.Neighborhoods
                .AddAsync(
                    Neighborhood.Create(district.Id, draft.Name, draft.Headman, draft.Phone, draft.Population),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        // List (not array): array.Contains binds to MemoryExtensions(ReadOnlySpan) on newer compilers and breaks EF.
        var officialNames = ArnavutkoyNeighborhoods.Select(n => n.Name).ToList();
        await context.Neighborhoods
            .IgnoreQueryFilters()
            .Where(n => n.DistrictId == district.Id && !n.IsDeleted && !officialNames.Contains(n.Name))
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(n => n.IsDeleted, true)
                    .SetProperty(n => n.UpdatedAtUtc, DateTime.UtcNow),
                cancellationToken)
            .ConfigureAwait(false);

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
        var drafts = new (string Title, string Body, DateTime? End)[]
        {
            (
                "Dijital Hizmetler Platformu Yayında",
                """
                Arnavutköy örnek dijital hizmetler platformu, kurgusal demo verilerle vatandaş ve personel akışlarını tek yerde sunmak üzere yayındadır. Bu ortam resmi belediye işlemi değildir.

                E-Belediye üzerinden belge başvurusu, nikah randevusu, imar harç hesabı ve spor tesisi rezervasyonu denenebilir. Vatandaş panelinde borç, hizmet masası ve ulaşım kartı senaryoları hazırdır.

                Giriş için demo hesaplar kullanılır. Veriler her ortam kurulumunda yeniden üretilir; gerçek kimlik, tapu veya tahsilat kaydı içermez.

                Sorumlu birim: Bilgi İşlem Müdürlüğü (demo)
                İletişim: 444 00 00 · e-belediye yardım masası
                Çalışma saati: Hafta içi 08:30–17:00
                Bağlantı: /e-belediye
                """,
                null),
            (
                "Hadımköy Lojistik Bölgesi Yol Çalışması",
                """
                Hadımköy Caddesi’nde planlı yol bakımı nedeniyle 15 Ağustos–12 Eylül 2026 tarihleri arasında şerit daraltması uygulanacaktır. Ağır vasıta trafiği gece 22:00–05:00 arasında yönlendirilir.

                36AS hattı Hadımköy Lojistik durağını geçici olarak 180 metre doğudaki geçici duraktan alır. 36HT seferleri mevcut güzergâhında kalır. Yaya geçişleri bariyerli yürüme yoluyla sağlanacaktır.

                Sürücülerden alternatif olarak Hastane Caddesi–Taşoluk bağlantısını kullanmaları istenir. Acil durum araçları şantiye görevlisinin yönlendirmesine tabidir.

                Etkilenen yerler: Hadımköy Caddesi, 36AS güzergâhı, lojistik bölge girişi
                Sorumlu birim: Fen İşleri Müdürlüğü
                İletişim: 444 00 00 · ulaşım bilgilendirme
                Çalışma saati: Hafta içi 09:00–18:00 · gece şeridi 22:00–05:00
                Bağlantı: /ulasim-agi
                """,
                DateTime.UtcNow.AddMonths(1)),
            (
                "Durusu ve Terkos Sahil Temizlik Seferberliği",
                """
                Durusu Gölü kenarı ve Terkos sahil bandında 18–29 Ağustos 2026 tarihlerinde temizlik, bilgilendirme ve kıyı düzenleme çalışması yapılacaktır. Program, yaz sezonu yoğunluğuna bağlı olarak güncellenebilir.

                Çalışma saatlerinde bazı yürüyüş yolları kısa süreli kapatılabilir. Toplanan atıklar geçici ayrıştırma noktasında tasnif edilir. Vatandaşlardan piknik atıklarını çöp ünitelerine bırakmaları rica olunur.

                Gönüllü katılım için mahalle muhtarlıkları ve Temizlik İşleri stantlarından kayıt alınır. Etkinlik kurgusal bir demo senaryosudur.

                Etkilenen yerler: Durusu Gölü seyir terası, Terkos sahil yürüyüş yolu
                Sorumlu birim: Temizlik İşleri Müdürlüğü
                İletişim: 444 00 00 · çevre hattı
                Çalışma saati: 07:30–16:30
                Bağlantı: /talepler
                """,
                DateTime.UtcNow.AddMonths(2)),
            (
                "Taşoluk Sosyal Yardım Başvuru Günleri",
                """
                Taşoluk, Bolluca ve Hacımaşlı mahalleleri için sosyal yardım ön başvuruları 20 Ağustos–25 Eylül 2026 arasında dijital kanaldan alınacaktır. Değerlendirme kurgusal puanlama ile yapılır; gerçek ödeme doğurmaz.

                Başvuru için T.C. kimlik, iletişim ve hane bilgisi yeterlidir. Eksik evrak 7 gün içinde tamamlanmazsa dosya işlemden kalkar. Sonuç, vatandaş paneli ve kısa mesaj simülasyonu ile bildirilir.

                Yoğunluk beklenen günlerde randevusuz gişe hizmeti sınırlıdır. Öncelik, dijital başvuruya verilir.

                Etkilenen yerler: Taşoluk, Bolluca, Hacımaşlı
                Sorumlu birim: Sosyal Destek Hizmetleri
                İletişim: 444 00 00 · sosyal yardım masası
                Çalışma saati: Hafta içi 09:00–16:30
                Başvuru: /yardim
                """,
                DateTime.UtcNow.AddDays(45)),
            (
                "Arnavutköy Merkez Çarşı Aydınlatma Yenilemesi",
                """
                Merkez mahalle çarşı aksında LED aydınlatma yenilemesi 11 Ağustos’ta başlamıştır. Direk değişimi ve kablo revizyonu gece 23:00–05:00 diliminde yapılır; gündüz saatlerinde yaya dolaşımı açıktır.

                Çalışma süresince bazı vitrin aydınlatmaları geçici olarak kapanabilir. Esnaf bilgilendirme toplantısı her Çarşamba 10:00’da çarşı muhtarlık odasında (demo) düzenlenir.

                Yeni armatürler hareket sensörlüdür. Arıza bildirimleri hizmet masası üzerinden alınır.

                Etkilenen yerler: Merkez çarşı, Çarşı Caddesi, cami önü meydanı
                Sorumlu birim: Fen İşleri Müdürlüğü
                İletişim: 444 00 00 · aydınlatma arıza hattı
                Çalışma saati: Gece uygulaması 23:00–05:00
                Belge: /hizmet-rehberi
                """,
                DateTime.UtcNow.AddMonths(3)),
            (
                "Planlı Bakım Duyurusu",
                """
                Dijital hizmetler platformu 16–17 Ağustos 2026 hafta sonunda planlı bakım nedeniyle kısa süreli erişime kapatılabilir. Kesinti pencereleri Cumartesi 23:30–Pazar 02:00 aralığında planlanmıştır.

                Bakım sırasında giriş, vezne ve başvuru takip ekranları yanıt vermeyebilir. İşlem yarıda kalırsa Pazar 09:00’dan sonra aynı kayıtla tekrar deneyiniz. Tahsilat denemeleri bu pencerede alınmaz.

                Acil duyurular bu sayfadan ve ana sayfa bülteninden paylaşılır.

                Sorumlu birim: Bilgi İşlem Müdürlüğü (demo)
                İletişim: 444 00 00 · sistem bildirimleri
                Çalışma saati: Bakım penceresi 23:30–02:00
                Bağlantı: /e-belediye
                """,
                DateTime.UtcNow.AddMonths(1)),
        };

        var existing = await context.Announcements.ToListAsync(cancellationToken).ConfigureAwait(false);
        var byTitle = existing.ToDictionary(a => a.Title, StringComparer.OrdinalIgnoreCase);

        foreach (var (title, body, end) in drafts)
        {
            if (byTitle.TryGetValue(title, out var current))
            {
                if (!string.Equals(current.Content, body, StringComparison.Ordinal))
                {
                    await context.Announcements
                        .Where(a => a.Id == current.Id)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Content, body), cancellationToken)
                        .ConfigureAwait(false);
                }

                continue;
            }

            var draft = Announcement.CreateDraft(title, body, end);
            draft.Publish(DateTime.UtcNow);
            context.Announcements.Add(draft);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedHrAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        static string Card(
            string blurb,
            string category,
            string phone,
            string email,
            string location,
            string services,
            string duties,
            string href)
        {
            return string.Join(
                "\n",
                blurb,
                string.Empty,
                $"Kategori: {category}",
                $"Telefon: {phone}",
                $"E-posta: {email}",
                $"Konum: {location}",
                "Saat: Hafta içi 08:30–17:00",
                $"Hizmetler: {services}",
                $"Görevler: {duties}",
                $"Bağlantı: {href}");
        }

        var desiredDepartments = new (string Name, string[] Aliases, string Description)[]
        {
            (
                "Başkanlık",
                Array.Empty<string>(),
                Card(
                    "Makam yazışması ve kurumsal temsil. Kurgusal dizin kaydıdır.",
                    "Başkanlık",
                    "444 00 00",
                    "baskanlik@demo.arnavutkoy.local",
                    "Hizmet binası, 4. kat",
                    "Makam yazışması · Temsil",
                    "Kurumsal yazışma ve protokol yönlendirmesi",
                    "/baskan")),
            (
                "Özel Kalem Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Makam randevu ve evrak takibi. Demo birim kaydıdır.",
                    "Başkanlık",
                    "444 00 00 / 1100",
                    "ozelkalem@demo.arnavutkoy.local",
                    "Hizmet binası, 4. kat",
                    "Randevu · Evrak",
                    "Makam evrakı ve randevu defteri",
                    "/iletisim")),
            (
                "Bilgi İşlem Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Portal, e-belediye ve dahili sistem desteği. Kurgusal kayıttır.",
                    "Dijital",
                    "444 00 00 / 2400",
                    "bilgiislem@demo.arnavutkoy.local",
                    "Hizmet binası, 1. kat",
                    "E-Belediye · Yardım masası",
                    "Uygulama desteği ve kayıt güvenliği",
                    "/e-belediye")),
            (
                "Fen İşleri Müdürlüğü",
                new[] { "Fen İşleri" },
                Card(
                    "Yol, kaldırım ve altyapı bakımının koordinasyonu. Demo kayıttır.",
                    "Altyapı",
                    "444 00 00 / 2100",
                    "fen@demo.arnavutkoy.local",
                    "Hizmet binası, 2. kat",
                    "Yol bakımı · Kaldırım",
                    "Saha ekipleri ve bakım programı",
                    "/talepler")),
            (
                "Park ve Bahçeler Müdürlüğü",
                new[] { "Park ve Bahçeler" },
                Card(
                    "Park, refüj ve ağaçlandırma işleri. Kurgusal birimdir.",
                    "Yeşil",
                    "444 00 00 / 2200",
                    "park@demo.arnavutkoy.local",
                    "Park atölyesi, Taşoluk",
                    "Park bakımı · Ağaçlandırma",
                    "Yeşil alan programı ve sulama",
                    "/talepler")),
            (
                "Temizlik İşleri Müdürlüğü",
                new[] { "Temizlik İşleri" },
                Card(
                    "Cadde, pazar ve sahil temizliği. Demo kayıttır.",
                    "Çevre",
                    "444 00 00 / 2300",
                    "temizlik@demo.arnavutkoy.local",
                    "Temizlik tesisi, Bolluca",
                    "Cadde temizliği · Konteyner",
                    "Toplama programı ve saha denetimi",
                    "/talepler")),
            (
                "Zabıta Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Pazar, işyeri ve kaldırım denetimi. Kurgusal kayıttır.",
                    "Düzen",
                    "444 00 00 / 2500",
                    "zabita@demo.arnavutkoy.local",
                    "Hizmet binası, zemin",
                    "Denetim · Kaldırım",
                    "Saha denetimi ve tutanak yönlendirmesi",
                    "/talepler")),
            (
                "Kültür ve Sosyal İşler Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Salon, kurs ve etkinlik takvimi. Demo birimdir.",
                    "Kültür",
                    "444 00 00 / 2600",
                    "kultur@demo.arnavutkoy.local",
                    "Kültür Merkezi",
                    "Salon · Kurs",
                    "Program takvimi ve salon tahsisi",
                    "/kultur")),
            (
                "Sosyal Destek Hizmetleri",
                Array.Empty<string>(),
                Card(
                    "Yardım başvurusu ve yönlendirme. Kurgusal kayıttır.",
                    "Sosyal",
                    "444 00 00 / 2700",
                    "sosyal@demo.arnavutkoy.local",
                    "Hizmet binası, 1. kat",
                    "Yardım başvurusu · Danışma",
                    "Başvuru kabulü ve dosya yönlendirme",
                    "/yardim")),
            (
                "İnsan Kaynakları Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Personel dizin ve özlük süreçleri. Demo kayıttır.",
                    "Kurumsal",
                    "444 00 00 / 2800",
                    "ik@demo.arnavutkoy.local",
                    "Hizmet binası, 3. kat",
                    "Dizin · Özlük",
                    "Kadro ve dizin güncellemesi",
                    "/birimler")),
            (
                "Mali Hizmetler Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Tahakkuk, vezne ve bütçe özeti. Kurgusal kayıttır.",
                    "Mali",
                    "444 00 00 / 2900",
                    "mali@demo.arnavutkoy.local",
                    "Hizmet binası, vezne holü",
                    "Vezne · Tahakkuk",
                    "Tahsilat ve bütçe özeti",
                    "/vezne")),
            (
                "Hukuk İşleri Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "Yazışma, tebligat ve sözleşme incelemesi. Demo kayıttır.",
                    "Hukuk",
                    "444 00 00 / 3000",
                    "hukuk@demo.arnavutkoy.local",
                    "Hizmet binası, 3. kat",
                    "Yazışma · Tebligat",
                    "Hukuki görüş ve evrak incelemesi",
                    "/iletisim")),
            (
                "İmar ve Şehircilik Müdürlüğü",
                Array.Empty<string>(),
                Card(
                    "İmar durumu, harç ve ruhsat yönlendirme. Kurgusal kayıttır.",
                    "Şehircilik",
                    "444 00 00 / 3100",
                    "imar@demo.arnavutkoy.local",
                    "Hizmet binası, 2. kat",
                    "İmar durumu · Harç",
                    "Ada/parsel sorgu ve harç yönlendirme",
                    "/imar")),
            (
                "Ulaşım Hizmetleri",
                new[] { "Ulaşım ve Trafik" },
                Card(
                    "Hat, durak ve kart işlem yönlendirmesi. Demo kayıttır.",
                    "Ulaşım",
                    "444 00 00 / 3200",
                    "ulasim@demo.arnavutkoy.local",
                    "Ulaşım masası, zemin",
                    "Hat bilgisi · Kart",
                    "Güzergâh bilgisi ve durak düzeni",
                    "/ulasim-agi")),
            (
                "Başvuru ve Hizmet Masası",
                Array.Empty<string>(),
                Card(
                    "Vatandaş talebi, yönlendirme ve takip kodu. Kurgusal kayıttır.",
                    "Destek",
                    "444 00 00",
                    "hizmet@demo.arnavutkoy.local",
                    "Hizmet binası, zemin hol",
                    "Talep · Yönlendirme",
                    "Başvuru kabulü ve birim yönlendirme",
                    "/talepler")),
            (
                "Su ve Kanalizasyon Koordinasyon",
                Array.Empty<string>(),
                Card(
                    "Abonelik ve arıza yönlendirme. Demo kayıttır.",
                    "Altyapı",
                    "444 00 00 / 3300",
                    "su@demo.arnavutkoy.local",
                    "Hizmet binası, 1. kat",
                    "Abonelik · Arıza",
                    "Su aboneliği ve arıza kaydı",
                    "/su")),
        };

        var departments = await context.Departments.ToListAsync(cancellationToken).ConfigureAwait(false);

        foreach (var draft in desiredDepartments)
        {
            if (draft.Description.Length > 500)
            {
                throw new InvalidOperationException($"HR seed açıklaması 500 karakteri aşıyor: {draft.Name}");
            }

            var existing = departments.FirstOrDefault(item =>
                item.Name.Equals(draft.Name, StringComparison.OrdinalIgnoreCase)
                || draft.Aliases.Any(alias => item.Name.Equals(alias, StringComparison.OrdinalIgnoreCase)));

            if (existing is null)
            {
                var created = Department.Create(draft.Name, draft.Description);
                await context.Departments.AddAsync(created, cancellationToken).ConfigureAwait(false);
                departments.Add(created);
            }
            else
            {
                existing.Rename(draft.Name, draft.Description);
            }
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        departments = await context.Departments.ToListAsync(cancellationToken).ConfigureAwait(false);
        Department? Find(string name) =>
            departments.FirstOrDefault(d => d.Name.Equals(name, StringComparison.OrdinalIgnoreCase));

        var staffCandidates = new (string Dept, string FullName, string Title, string Email, string Phone)[]
        {
            ("Başkanlık", "Demo Makam Danışmanı", "Danışman", "makam@demo.arnavutkoy.local", "+905009990010"),
            ("Özel Kalem Müdürlüğü", "Demo Özel Kalem Müdürü", "Müdür", "ozelkalem@demo.arnavutkoy.local", "+905009990011"),
            ("Bilgi İşlem Müdürlüğü", "Demo Bilgi İşlem Müdürü", "Müdür", "bilgiislem@demo.arnavutkoy.local", "+905009990012"),
            ("Bilgi İşlem Müdürlüğü", "Demo Yardım Masası Uzmanı", "Uzman", "yardimmasasi@demo.arnavutkoy.local", "+905009990013"),
            ("Fen İşleri Müdürlüğü", "Demo Fen Müdürü", "Müdür", "fen@demo.arnavutkoy.local", "+905009990001"),
            ("Fen İşleri Müdürlüğü", "Demo Fen Şefi", "Şef", "fen-sef@demo.arnavutkoy.local", "+905009990014"),
            ("Temizlik İşleri Müdürlüğü", "Demo Temizlik Şefi", "Şef", "temizlik@demo.arnavutkoy.local", "+905009990002"),
            ("Başvuru ve Hizmet Masası", "Demo Hizmet Danışmanı", "Danışman", "hizmet@demo.arnavutkoy.local", "+905009990003"),
            ("Zabıta Müdürlüğü", "Demo Zabıta Amiri", "Amir", "zabita@demo.arnavutkoy.local", "+905009990004"),
            ("Park ve Bahçeler Müdürlüğü", "Demo Park Sorumlusu", "Uzman", "park@demo.arnavutkoy.local", "+905009990005"),
            ("Su ve Kanalizasyon Koordinasyon", "Demo Su Koordinatörü", "Koordinatör", "su@demo.arnavutkoy.local", "+905009990006"),
            ("Sosyal Destek Hizmetleri", "Demo Sosyal Çalışmacı", "Uzman", "sosyal@demo.arnavutkoy.local", "+905009990007"),
            ("Ulaşım Hizmetleri", "Demo Ulaşım Planlamacı", "Planlamacı", "ulasim@demo.arnavutkoy.local", "+905009990008"),
            ("Kültür ve Sosyal İşler Müdürlüğü", "Demo Kültür Müdürü", "Müdür", "kultur@demo.arnavutkoy.local", "+905009990015"),
            ("İnsan Kaynakları Müdürlüğü", "Demo İK Uzmanı", "Uzman", "ik@demo.arnavutkoy.local", "+905009990016"),
            ("Mali Hizmetler Müdürlüğü", "Demo Mali Müdür", "Müdür", "mali@demo.arnavutkoy.local", "+905009990017"),
            ("Hukuk İşleri Müdürlüğü", "Demo Hukuk Müşaviri", "Müşavir", "hukuk@demo.arnavutkoy.local", "+905009990018"),
            ("İmar ve Şehircilik Müdürlüğü", "Demo İmar Şefi", "Şef", "imar@demo.arnavutkoy.local", "+905009990019"),
        };

        var existingStaff = await context.StaffMembers.ToListAsync(cancellationToken).ConfigureAwait(false);
        var staffByEmail = existingStaff.ToDictionary(item => item.Email, StringComparer.OrdinalIgnoreCase);

        foreach (var candidate in staffCandidates)
        {
            var dept = Find(candidate.Dept);
            if (dept is null)
            {
                continue;
            }

            if (staffByEmail.TryGetValue(candidate.Email, out var existingMember))
            {
                existingMember.UpdateContact(candidate.Title, candidate.Email, candidate.Phone);
                existingMember.MoveToDepartment(dept.Id);
                continue;
            }

            var created = StaffMember.Create(dept.Id, candidate.FullName, candidate.Title, candidate.Email, candidate.Phone);
            await context.StaffMembers.AddAsync(created, cancellationToken).ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task SeedTransportationAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        await UpsertDemoBusLinesAsync(context, cancellationToken).ConfigureAwait(false);
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

    private static string BusRouteBody(
        string fromTo,
        string neighborhoods,
        string? kind = null,
        string? tariff = null,
        int? durationMin = null,
        string? note = null)
    {
        var lines = new List<string>
        {
            fromTo,
            "Kaynak: İETT / Arnavutköy Belediyesi",
            "Liste: 24 Ocak 2021",
            $"Mahalle: {neighborhoods}",
        };
        if (!string.IsNullOrWhiteSpace(kind))
        {
            lines.Add($"Tür: {kind}");
        }

        if (!string.IsNullOrWhiteSpace(tariff))
        {
            lines.Add($"Tarife: {tariff}");
        }

        if (durationMin is int minutes)
        {
            lines.Add($"Süre: {minutes} dk");
        }

        if (!string.IsNullOrWhiteSpace(note))
        {
            lines.Add($"Not: {note}");
        }

        return string.Join(Environment.NewLine, lines);
    }

    private static async Task UpsertDemoBusLinesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        const decimal demoBoardFare = 17.50m;

        var drafts = new (string Code, string Name, string Summary, string[] Stops)[]
        {
            ("336", "Arnavutköy - Eminönü", BusRouteBody("Arnavutköy → Eminönü", "Arnavutköy, Taşoluk", "Normal", "Tek biletli", 82), ["Arnavutköy", "Eminönü"]),
            ("336A", "Balaban Köyü - Mescidi Selam", BusRouteBody("Balaban Köyü → Mescidi Selam", "Balaban, Arnavutköy", "Normal", "Tek biletli", 100), ["Balaban Köyü", "Mescidi Selam"]),
            ("336M", "Arnavutköy - Mecidiyeköy", BusRouteBody("Arnavutköy → Mecidiyeköy", "Arnavutköy", "Normal", "Tek biletli", 86), ["Arnavutköy", "Mecidiyeköy"]),
            ("336G", "Taşoluk Peron - Tekstilkent Metro", BusRouteBody("Taşoluk Peronlar → Tekstilkent Metro", "Taşoluk", "Normal", "Tek biletli", 61, "(-1) işaretli saatlerde Kiptaş Konutları güzergâhından hizmet verir."), ["Taşoluk Peronlar", "Tekstilkent Metro"]),
            ("336H", "Hadımköy - Mescidi Selam", BusRouteBody("Hadımköy → Mescidi Selam", "Hadımköy, Yassıören", "Normal", "Tek biletli", 82, "Y işaretli saatlerde Yassıören - Mescid-i Selam güzergâhında hizmet verir."), ["Hadımköy", "Mescidi Selam"]),
            ("336K", "Yeniköy / Karaburun - Mescidi Selam", BusRouteBody("Yeniköy / Karaburun → Mescidi Selam", "Yeniköy, Karaburun", "Normal", "Tek biletli", 110, "B işaretli saatlerde Baklalı Köyü güzergâhından hizmet verir."), ["Yeniköy", "Karaburun", "Mescidi Selam"]),
            ("36AS", "Taşoluk Peronlar / Sefaköy Metrobüs", BusRouteBody("Taşoluk Peronlar → Sefaköy Metrobüs", "Taşoluk, Arnavutköy, Sefaköy", "Normal", "Tek biletli", 100), ["Taşoluk Peronlar", "Sefaköy Metrobüs"]),
            ("36AY", "Arnavutköy - Yenibosna Metro", BusRouteBody("Arnavutköy → Yenibosna Metro", "Arnavutköy, Taşoluk, Yenibosna", "Normal", "Tek biletli", 86, "T işaretli saatlerde Taşoluk Peronlar - Yenibosna Metro güzergâhında hizmet verir."), ["Arnavutköy", "Yenibosna Metro"]),
            ("36B", "Bolluca / Boğazköy - Cebeci", BusRouteBody("Bolluca / Boğazköy → Cebeci", "Bolluca, Boğazköy, Cebeci, Arnavutköy", "Normal", "Tek biletli", 57, "M işaretli saatlerde Arnavutköy Merkez İ.Ö.O'ya gider."), ["Bolluca", "Boğazköy", "Cebeci"]),
            ("36CB", "Cebeci Köyü - İstiklal Mahallesi", BusRouteBody("Cebeci Köyü → İstiklal Mahallesi", "Cebeci, İstiklal", "Normal", "Tek biletli", 33, "(-1) işaretli saatlerde Cebeci Köyiçi - Mescid-i Selam arasında hizmet verir."), ["Cebeci Köyü", "İstiklal Mahallesi"]),
            ("36D", "Arnavutköy - Deliklikaya", BusRouteBody("Arnavutköy → Deliklikaya", "Arnavutköy, Deliklikaya", "Normal", "Tek biletli", 86, "X işaretli saatlerde Hacımaşlı'ya girmez."), ["Arnavutköy", "Deliklikaya"]),
            ("36HT", "Fatih Mahallesi / Haraççı - Cebeci", BusRouteBody("Fatih Mahallesi / Haraççı → Cebeci", "Fatih, Haraççı, Cebeci", "Normal", "Tek biletli", 74), ["Fatih Mahallesi", "Haraççı", "Cebeci"]),
            ("36Y", "Taşoluk Peronlar - Yenikapı", BusRouteBody("Taşoluk Peronlar → Yenikapı", "Taşoluk", "Normal", "Tek biletli", 62, "(-2) işaretli saatlerde İstiklal Mahallesi-Mahmutbey Metro güzergâhında hizmet verir."), ["Taşoluk Peronlar", "Yenikapı"]),
            ("36YS", "Yassıören - Arnavutköy", BusRouteBody("Yassıören → Arnavutköy", "Yassıören, Arnavutköy", "Normal", "Tek biletli", 79, "B işaretli saatlerde Yassıören - Arnavutköy Peronlar güzergâhında hizmet verir."), ["Yassıören", "Arnavutköy"]),
            ("MK22", "Taşoluk Peronlar - Metrokent", BusRouteBody("Taşoluk Peronlar → Metrokent", "Taşoluk, Başakşehir", "Besleme", "Metro entegre", 53), ["Taşoluk Peronlar", "Metrokent"]),
            ("HT18", "Hadımköy / İ.Ü. Cerrahpaşa Kampüsü - Tüyap", BusRouteBody("Hadımköy / İ.Ü. Cerrahpaşa Kampüsü → Tüyap", "Hadımköy", "Normal", "Tek biletli", 62, "H işaretli saatlerde Hadımköy-Haramidere güzergâhında hizmet verir."), ["Hadımköy", "İ.Ü. Cerrahpaşa Kampüsü", "Tüyap"]),
            ("H-6", "Yunus Emre Mah. / Arnavutköy - İstanbul Havalimanı", BusRouteBody("Yunus Emre Mahallesi / Arnavutköy → İstanbul Havalimanı", "Yunus Emre, Arnavutköy", "Ekspres", "2 tam biletli", 93, "Cumartesi 12:00-21:00 halk pazarı nedeniyle seferler Nene Hatun Parkı durağından başlayıp aynı durakta sonlanır."), ["Yunus Emre Mahallesi", "Arnavutköy", "İstanbul Havalimanı"]),
            ("418", "Hadımköy - Haramidere", BusRouteBody("Hadımköy → Haramidere", "Hadımköy", "Normal", "Tek biletli", 76), ["Hadımköy", "Haramidere"]),
            ("48KA", "Kemerburgaz - Arnavutköy", BusRouteBody("Kemerburgaz → Arnavutköy", "Arnavutköy", "Normal", "Tek biletli", 68), ["Kemerburgaz", "Arnavutköy"]),
            ("48M", "Akpınar Köyü - Arnavutköy", BusRouteBody("Akpınar Köyü → Arnavutköy", "Akpınar, Arnavutköy", "Normal", "Tek biletli", 46), ["Akpınar Köyü", "Arnavutköy"]),
            ("144A", "Deliklikaya / Avcılar Metrobüs", BusRouteBody("Deliklikaya → Avcılar Metrobüs", "Deliklikaya", "Normal", "Tek biletli", 57), ["Deliklikaya", "Avcılar Metrobüs"]),
            ("144B", "Deliklikaya - Yeşilbayır Köyü - Yeşilkent", BusRouteBody("Deliklikaya → Yeşilbayır Köyü → Yeşilkent", "Deliklikaya, Yeşilbayır", "Normal", "Tek biletli", 81, "T işaretli saatlerde İSTOEB - Toskana Vadisi güzergâhında hizmet verir."), ["Deliklikaya", "Yeşilbayır Köyü", "Yeşilkent"]),
            ("144H", "Heybetli Sokak / Deliklikaya - Haramidere", BusRouteBody("Heybetli Sokak / Deliklikaya → Haramidere", "Deliklikaya", "Normal", "Tek biletli", 58), ["Heybetli Sokak", "Deliklikaya", "Haramidere"]),
            ("144K", "Ömerli KİPTAŞ - Esenkent", BusRouteBody("Ömerli KİPTAŞ → Esenkent", "Ömerli", "Normal", "Tek biletli", 38, "E işaretli saatlerde Ömerli KİPTAŞ - 2801. Sokak - Esenkent güzergâhında hizmet verir."), ["Ömerli KİPTAŞ", "Esenkent"]),
            ("144M", "Deliklikaya - Mahmutbey Metro", BusRouteBody("Deliklikaya → Mahmutbey Metro", "Deliklikaya", "Normal", "Tek biletli", 78), ["Deliklikaya", "Mahmutbey Metro"]),
        };

        var retired = new List<string> { "78YB", "AK1", "336T", "336MC", "36TC" };
        await context.BusLines
            .Where(line => retired.Contains(line.Code))
            .ExecuteUpdateAsync(
                setters => setters.SetProperty(line => line.IsActive, false),
                cancellationToken)
            .ConfigureAwait(false);

        var existing = await context.BusLines.ToListAsync(cancellationToken).ConfigureAwait(false);
        var byCode = existing.ToDictionary(line => line.Code, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (byCode.TryGetValue(draft.Code, out var current))
            {
                await context.BusLines
                    .Where(line => line.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(line => line.Name, draft.Name)
                            .SetProperty(line => line.RouteSummary, draft.Summary)
                            .SetProperty(line => line.BaseFare, demoBoardFare)
                            .SetProperty(line => line.IsActive, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.BusLines.Add(BusLine.Create(draft.Code, draft.Name, draft.Summary, demoBoardFare));
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        context.ChangeTracker.Clear();

        existing = await context.BusLines.ToListAsync(cancellationToken).ConfigureAwait(false);
        byCode = existing.ToDictionary(line => line.Code, StringComparer.OrdinalIgnoreCase);

        var catalogIds = drafts
            .Select(draft => byCode.TryGetValue(draft.Code, out var line) ? line.Id : Guid.Empty)
            .Where(id => id != Guid.Empty)
            .ToList();

        if (catalogIds.Count > 0)
        {
            await context.BusLineDepartures
                .Where(item => catalogIds.Contains(item.BusLineId))
                .ExecuteDeleteAsync(cancellationToken)
                .ConfigureAwait(false);

            await context.BusLineStops
                .Where(item => catalogIds.Contains(item.BusLineId))
                .ExecuteDeleteAsync(cancellationToken)
                .ConfigureAwait(false);
        }

        foreach (var draft in drafts)
        {
            if (!byCode.TryGetValue(draft.Code, out var line))
            {
                continue;
            }

            var stops = draft.Stops
                .Select((name, index) => BusLineStop.Create(line.Id, index + 1, name))
                .ToArray();
            await context.BusLineStops.AddRangeAsync(stops, cancellationToken).ConfigureAwait(false);
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
            var contents = new[]
            {
                PortalContent.Create(PortalContentKind.Mayor, "Başkanın mesajı", "Demo portföy — kurgusal başkan mesajı.",
                    "Arnavutköy’de dijital hizmetleri tek portalda sunmak için bu örnek platform geliştirildi. Tüm içerikler kurgusaldır; resmi kurumla bağlantısı yoktur.",
                    "baskan-mesaji", category: "Kurumsal", sortOrder: 1),
                PortalContent.Create(PortalContentKind.Corporate, "Kurumsal yapı", "Organizasyon ve birimler.",
                    "Belediye hizmetleri; mali hizmetler, fen işleri, kültür, sosyal destek ve ulaşım birimleri üzerinden kurgusal olarak sunulur.",
                    "kurumsal-yapi", category: "Kurumsal", sortOrder: 1),
                PortalContent.Create(PortalContentKind.Project, "Yeşilbayır park yenileme", "Faaliyet / proje (demo).",
                    "Yeşilbayır mahallesinde kurgusal park yenileme projesi. İlerleme oranı demo veridir.",
                    "faaliyet-yesilbayir-park", location: "Yeşilbayır", category: "Park", sortOrder: 1),
                PortalContent.Create(PortalContentKind.Project, "Hadımköy bisiklet yolu", "Faaliyet / proje (demo).",
                    "Hadımköy–Taşoluk aksında kurgusal bisiklet yolu etüdü.",
                    "faaliyet-bisiklet", location: "Hadımköy", category: "Ulaşım", sortOrder: 2),
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

        await UpsertDemoEventsAsync(context, cancellationToken).ConfigureAwait(false);
        await UpsertDemoProjectsAsync(context, cancellationToken).ConfigureAwait(false);
        await UpsertDemoNewsAsync(context, cancellationToken).ConfigureAwait(false);
        await UpsertDemoCultureVenuesAsync(context, cancellationToken).ConfigureAwait(false);
        await UpsertDemoServiceGuidesAsync(context, cancellationToken).ConfigureAwait(false);

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

    private static DateTime DemoEventUtc(int daysFromToday, int hour, int minute = 0)
    {
        var day = DateTime.UtcNow.Date.AddDays(daysFromToday);
        return new DateTime(day.Year, day.Month, day.Day, hour, minute, 0, DateTimeKind.Utc).AddHours(-3);
    }

    private static async Task UpsertDemoEventsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var drafts = new (string Slug, string Title, string Summary, string Body, string Location, string Category, DateTime Start, DateTime End, int Order)[]
        {
            (
                "etkinlik-sinema",
                "Açık hava sineması — Merkez Meydan",
                "Merkez Meydan’da ücretsiz açık hava gösterimi. Minderinizi alın, film gün batımında başlar.",
                """
                Arnavutköy Merkez Meydan’da yazlık açık hava sineması düzenlenir. Gösterim kurgusal bir demo programıdır; bilet satılmaz.

                Alan 18:30’da açılır, kısa müzik dinletisinin ardından film başlar. Gıda tezgâhları meydanın kuzey cephesinde konumlanır. Yağış durumunda program Kültür Merkezi salonuna alınır.

                Ücret: Ücretsiz
                Katılım: Yerinde, kontenjan dolana kadar
                Yaş: Her yaş · 12 yaş altı veli refakati
                Kontenjan: 400 kişi
                Program: 18:30 – Alan açılışı · 19:00 – Kısa dinleti · 19:20 – Film gösterimi · 22:00 – Kapanış
                """,
                "Arnavutköy Merkez Meydan",
                "Kültür",
                DemoEventUtc(5, 19),
                DemoEventUtc(5, 22),
                1),
            (
                "etkinlik-kosu",
                "Gençlik koşusu — Boğazköy",
                "5 km parkurlu kurgusal koşu. Su ikmali ve finiş alanı Boğazköy spor çayırında.",
                """
                Boğazköy mahalle parkuru üzerinde 5 kilometrelik gençlik koşusu düzenlenir. Parkur asfalt ve stabilize karışıktır; tempo serbesttir.

                Kayıt, spor randevu ekranından veya yarış sabahı 08:00–08:45 arasında masa başından alınır. Finiste su ve meyve ikramı vardır. Sağlık ekibi start noktasında bekler.

                Ücret: Ücretsiz
                Katılım: Spor randevu veya yerinde kayıt
                Yaş: 14+
                Kontenjan: 180 sporcu
                Program: 08:00 – Kayıt masası · 09:00 – Start · 10:30 – Finis · 12:00 – Ödül töreni
                """,
                "Boğazköy spor alanı",
                "Spor",
                DemoEventUtc(12, 9),
                DemoEventUtc(12, 12),
                2),
            (
                "etkinlik-ritim",
                "Ritim atölyesi — Kültür Merkezi",
                "Açık çağrılı ritim buluşması. Enstrümanınızı getirin veya yerindeki perküsyon setini kullanın.",
                """
                Kültür Merkezi fuaye ve bahçesinde ritim atölyesi yapılır. Program 30 dakikalık ısınma, 40 dakikalık grup çalışması ve kısa bir açık dinleti ile biter.

                Davul, tef ve cajon sınırlı sayıda sağlanır. Kendi enstrümanınızı getirmeniz önerilir. Kayıt zorunlu değildir; yerler dolunca giriş kapanır.

                Ücret: Ücretsiz
                Katılım: Yerinde, sıra ile
                Yaş: 10+
                Kontenjan: 60 kişi
                Program: 18:00 – Isınma · 18:30 – Grup çalışması · 19:10 – Açık dinleti · 20:00 – Kapanış
                """,
                "Arnavutköy Kültür Merkezi",
                "Müzik",
                DemoEventUtc(4, 18),
                DemoEventUtc(4, 20),
                3),
            (
                "etkinlik-kodlama",
                "Kodlamaya yolculuk — bilim atölyesi",
                "9–14 yaş için dört haftalık bilim ve kodlama tanıtım günü. İlk buluşma ücretsizdir.",
                """
                Çocuklar blok tabanlı kodlama ve basit robotik setlerle tanışır. İlk oturum tanışma ve deneme günüdür; sonraki haftalar için kontenjan ayrıca açılır.

                Velilerin ilk 20 dakika salonda kalması yeterlidir. Dizüstü zorunlu değildir. Atölye kurgusal bir eğitim demosudur.

                Ücret: İlk gün ücretsiz
                Katılım: Dijital kayıt önerilir
                Yaş: 9–14
                Kontenjan: 24 öğrenci
                Program: 10:00 – Tanışma · 10:20 – Blok kodlama · 11:10 – Robotik deneme · 12:00 – Bitiş
                """,
                "Taşoluk bilim atölyesi",
                "Eğitim",
                DemoEventUtc(8, 10),
                DemoEventUtc(8, 12),
                4),
            (
                "etkinlik-sahil",
                "Durusu sahil akşamı",
                "Göl kenarında müzik, piknik ve kısa doğa yürüyüşü. Çöpünüzü götürün, sahil temiz kalsın.",
                """
                Durusu seyir terası ve yürüyüş yolunda açık hava akşamı düzenlenir. 16:00’da kısa doğa yürüyüşü, 17:30’da akustik dinleti vardır.

                Mangal yakılmaz. Belediye stantlarından su ve geri dönüşüm torbası dağıtılır. Hava bozarsa yürüyüş iptal, dinleti amfiye alınır.

                Ücret: Ücretsiz
                Katılım: Açık alan, kayıt yok
                Yaş: Her yaş
                Kontenjan: Alan kapasitesi
                Program: 16:00 – Doğa yürüyüşü · 17:30 – Akustik dinleti · 19:00 – Kapanış
                """,
                "Durusu sahil bandı",
                "Açık hava",
                DemoEventUtc(18, 16),
                DemoEventUtc(18, 19),
                5),
            (
                "etkinlik-tiyatro",
                "Çocuk tiyatrosu — Taşoluk",
                "Hafta sonu matinesi. Masal uyarlaması, 70 dakika, ücretsiz bilet simülasyonu.",
                """
                Taşoluk çok amaçlı salonda çocuk tiyatrosu matinesi oynanır. Oyun 70 dakikadır; ara yoktur.

                Koltuğa giriş 13:40’ta açılır. 0–3 yaş kucakta ücretsizdir. Gösteri kurgusaldır; gerçek bilet sistemi yoktur.

                Ücret: Ücretsiz
                Katılım: Yerinde sıra numarası
                Yaş: 4–10 önerilir
                Kontenjan: 120 koltuk
                Program: 13:40 – Salon açılışı · 14:00 – Oyun · 15:10 – Selamlama · 15:30 – Çıkış
                """,
                "Taşoluk çok amaçlı salon",
                "Çocuk",
                DemoEventUtc(9, 14),
                DemoEventUtc(9, 15, 30),
                6),
        };

        var existing = await context.PortalContents
            .Where(item => item.Kind == PortalContentKind.Event)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var bySlug = existing.ToDictionary(item => item.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (bySlug.TryGetValue(draft.Slug, out var current))
            {
                await context.PortalContents
                    .Where(item => item.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Title, draft.Title)
                            .SetProperty(item => item.Summary, draft.Summary)
                            .SetProperty(item => item.Body, draft.Body)
                            .SetProperty(item => item.Location, draft.Location)
                            .SetProperty(item => item.Category, draft.Category)
                            .SetProperty(item => item.StartsAtUtc, draft.Start)
                            .SetProperty(item => item.EndsAtUtc, draft.End)
                            .SetProperty(item => item.SortOrder, draft.Order)
                            .SetProperty(item => item.IsPublished, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.PortalContents.Add(
                PortalContent.Create(
                    PortalContentKind.Event,
                    draft.Title,
                    draft.Summary,
                    draft.Body,
                    draft.Slug,
                    location: draft.Location,
                    category: draft.Category,
                    startsAtUtc: draft.Start,
                    endsAtUtc: draft.End,
                    sortOrder: draft.Order));
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static DateTime DemoMonthUtc(int monthsFromNow)
    {
        var day = DateTime.UtcNow.Date.AddMonths(monthsFromNow);
        return new DateTime(day.Year, day.Month, 1, 0, 0, 0, DateTimeKind.Utc);
    }

    private static async Task UpsertDemoProjectsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var drafts = new (string Slug, string Title, string Summary, string Body, string Location, string Category, DateTime Start, DateTime? End, int Order)[]
        {
            (
                "faaliyet-yesilbayir-park",
                "Yeşilbayır mahalle parkı yenileme",
                "Oyun grubu, yürüyüş halkası ve gece aydınlatması yenileniyor. Kuzey girişi çalışma süresince açık kalır.",
                """
                Yeşilbayır mahalle parkında kauçuk zemin, 5–12 yaş oyun grubu ve çevre aydınlatması yenilenir. Mevcut ağaçlar korunur; gölgelik ve oturma cepleri eklenir.

                Çalışma 08:00–18:00 arasındadır. Parkın kuzey kapısı yayaya açıktır. Kayıt kurgusaldır; resmi ihale belgesi değildir.

                Durum: Devam ediyor
                İlerleme: %62
                Bütçe: 18,4 milyon ₺ (demo)
                Yüklenici: Park ve Bahçeler Müdürlüğü — kurgusal yük
                Bağlantı: /talepler
                """,
                "Yeşilbayır mahalle parkı",
                "Park",
                DemoMonthUtc(-8),
                DemoMonthUtc(4),
                1),
            (
                "faaliyet-durusu-kiyi",
                "Durusu kıyı bandı düzenlemesi",
                "Seyir terası, ayrılmış yürüyüş–bisiklet izi ve gece aydınlatması. Kıyı dolgusu yapılmaz.",
                """
                Durusu / Terkos kıyı bandında yürüyüş ve bisiklet izi ayrılır, oturma nişleri ve LED aydınlatma döşenir. Doğal kıyı şeridi korunur; dolgu ve mangal alanı açılmaz.

                Hafta sonu yürüyüş hattı kısmi açık tutulur. Kurgusal çevre yatırım kaydıdır.

                Durum: Devam ediyor
                İlerleme: %74
                Bütçe: 27,1 milyon ₺ (demo)
                Yüklenici: Park ve Bahçeler Müdürlüğü — kurgusal yük
                Bağlantı: /talepler
                """,
                "Durusu sahil bandı",
                "Park",
                DemoMonthUtc(-6),
                DemoMonthUtc(3),
                2),
            (
                "faaliyet-sazlibosna-bahce",
                "Sazlıbosna millet bahçesi",
                "Koşu parkur, çocuk oyun alanı ve yağmur bahçesi etüdü. İhale paketi 2027 başı için hazırlanıyor.",
                """
                Sazlıbosna mahalle çayırında millet bahçesi ölçeğinde yeşil alan planlanır. Koşu halkası, yağmur bahçesi ve gölgelikli oturma öngörülür.

                Kamulaştırma listesi henüz kesinleşmemiştir. Kayıt planlama demosudur.

                Durum: Planlama
                İlerleme: %18
                Bütçe: Etüt ve uygulama projesi (demo)
                Yüklenici: Park ve Bahçeler — kurgusal birim
                Bağlantı: /talepler
                """,
                "Sazlıbosna",
                "Park",
                DemoMonthUtc(3),
                DemoMonthUtc(16),
                3),
            (
                "faaliyet-hadimkoy-asfalt",
                "Hadımköy sanayi aksı asfalt yenileme",
                "Sanayi girişi ile mahalle bağlantısında binder ve aşınma tabakası. Gece çalışması planlandı.",
                """
                Hadımköy sanayi aksında çukur dolgu, binder ve aşınma tabakası yenilenir. Yaya geçitleri termoplastik çizgi ile yeniden işaretlenir.

                Ağır vasıta 22:00–05:00 arasında yönlendirilir. Kurgusal yol yapım kaydıdır.

                Durum: Devam ediyor
                İlerleme: %55
                Bütçe: 31,6 milyon ₺ (demo)
                Yüklenici: Fen İşleri Müdürlüğü — kurgusal yük
                Bağlantı: /ulasim-agi
                """,
                "Hadımköy sanayi aksı",
                "Ulaşım",
                DemoMonthUtc(-3),
                DemoMonthUtc(2),
                4),
            (
                "faaliyet-bisiklet",
                "Hadımköy–Taşoluk bisiklet koridoru",
                "Sanayi girişi ile Taşoluk merkezi arasında ayrılmış bisiklet yolu. Kavşak kutuları etüt ediliyor.",
                """
                Hadımköy sanayi girişi ile Taşoluk mahalle merkezi arasında 3,8 km ayrılmış bisiklet koridoru planlanır. Kavşaklarda kutu dönüş, aydınlatma ve yön tabelası öngörülür.

                İhale henüz açılmamıştır. Güzergâh, ulaşım ağı planı ile birlikte okunmalıdır.

                Durum: Planlama
                İlerleme: %12
                Bütçe: Etüt aşaması (demo)
                Yüklenici: Ulaşım Planlama — kurgusal birim
                Bağlantı: /ulasim-agi
                """,
                "Hadımköy",
                "Ulaşım",
                DemoMonthUtc(2),
                DemoMonthUtc(14),
                5),
            (
                "faaliyet-boyalik-yol",
                "Boyalık mahalle içi yol iyileştirme",
                "Stabilize sokakların asfaltlanması ve yağmur oluğu. Okul önü yaya geçidi tamamlandı.",
                """
                Boyalık mahalle içi 1,2 km stabilize yol asfaltlanır. Yağmur oluğu ve okul önü yaya geçidi işaretlenir.

                Teslim sonrası bakım Fen İşleri kış programına alınır. Kayıt tamamlanmış yol işidir.

                Durum: Tamamlandı
                İlerleme: %100
                Bütçe: 8,9 milyon ₺ (demo)
                Yüklenici: Fen İşleri Müdürlüğü — kurgusal yük
                Bağlantı: /ulasim-agi
                """,
                "Boyalık",
                "Ulaşım",
                DemoMonthUtc(-11),
                DemoMonthUtc(-2),
                6),
            (
                "faaliyet-carsi-aydinlatma",
                "Merkez çarşı LED aydınlatma",
                "Çarşı aksında sodyum armatürler LED’e çevriliyor. Çalışma gece 23:00–05:00 bandında.",
                """
                Merkez çarşı aksında mevcut sodyum armatürler LED’e dönüştürülür. Yaya geçitlerinde ek yönlendirme ışığı konur.

                Esnaf vitrinleri çalışma saatlerinde kapatılmaz. Kurgusal altyapı kaydıdır.

                Durum: Devam ediyor
                İlerleme: %28
                Bütçe: 6,2 milyon ₺ (demo)
                Yüklenici: Fen İşleri Müdürlüğü — kurgusal yük
                Bağlantı: /talepler
                """,
                "Arnavutköy Merkez çarşı",
                "Altyapı",
                DemoMonthUtc(-1),
                DemoMonthUtc(5),
                7),
            (
                "faaliyet-imrahor-su",
                "İmrahor içme suyu hat yenileme",
                "Eski asbestli hat HDPE ile değiştiriliyor. Mahalle şebekesi kademeli devreye alınır.",
                """
                İmrahor mahallesinde eski içme suyu hattı HDPE boru ile yenilenir. Abone bağlantıları gece pencerelerinde kesilir; tanker ikmali duyurulur.

                İş, su abonelik ekranı ile birlikte izlenir. Kurgusal altyapı kaydıdır.

                Durum: Devam ediyor
                İlerleme: %47
                Bütçe: 22,0 milyon ₺ (demo)
                Yüklenici: Su ve Kanalizasyon — kurgusal yük
                Bağlantı: /su
                """,
                "İmrahor",
                "Altyapı",
                DemoMonthUtc(-5),
                DemoMonthUtc(6),
                8),
            (
                "faaliyet-deliklikaya-yagmur",
                "Deliklikaya yağmursuyu hattı",
                "Sel baskını yaşanan sokaklara ızgara ve kolektör. İlk etap kazısı bitti, boru serimi sürüyor.",
                """
                Deliklikaya’da yağışta su toplayan sokaklara ızgara, menhol ve kolektör döşenir. İlk etap kazısı tamamlandı; boru serimi ve asfalt yaması sıradadır.

                Kayıt kurgusal drenaj yatırımındır.

                Durum: Devam ediyor
                İlerleme: %36
                Bütçe: 14,7 milyon ₺ (demo)
                Yüklenici: Fen İşleri Müdürlüğü — kurgusal yük
                Bağlantı: /talepler
                """,
                "Deliklikaya",
                "Altyapı",
                DemoMonthUtc(-2),
                DemoMonthUtc(7),
                9),
            (
                "faaliyet-tasoluk-sosyal",
                "Taşoluk sosyal tesis",
                "Mahalle evi, kurs odaları ve çok amaçlı salon. Kabuk bitti, iç imalat ve tesisat sürüyor.",
                """
                Taşoluk’ta mahalle evi, iki kurs odası ve çok amaçlı salon inşa edilir. Zemin katta danışma; üst katta kurs odaları yer alır.

                Teslim sonrası kurs takvimi kültür biriminden yayınlanır. Yapı kurgusaldır.

                Durum: Devam ediyor
                İlerleme: %41
                Bütçe: 42,8 milyon ₺ (demo)
                Yüklenici: Sosyal Tesisler — kurgusal yük
                Bağlantı: /yardim
                """,
                "Taşoluk",
                "Sosyal",
                DemoMonthUtc(-4),
                DemoMonthUtc(8),
                10),
            (
                "faaliyet-dursunkoy-mahalle",
                "Dursunköy mahalle evi",
                "Tek katlı mahalle evi ve açık oturma avlusu. Temel atıldı, kaba inşaat yaz döneminde hızlanır.",
                """
                Dursunköy’de tek katlı mahalle evi, çay ocağı ve avlu oturması yapılır. Muhtarlık toplantıları ve kurslar aynı çatı altında toplanır.

                Kaba inşaat 2026 yazında yoğunlaşır. Kurgusal sosyal tesis kaydıdır.

                Durum: Devam ediyor
                İlerleme: %22
                Bütçe: 11,3 milyon ₺ (demo)
                Yüklenici: Sosyal Tesisler — kurgusal yük
                Bağlantı: /yardim
                """,
                "Dursunköy",
                "Sosyal",
                DemoMonthUtc(-1),
                DemoMonthUtc(11),
                11),
            (
                "faaliyet-bolluca-atik",
                "Bolluca atık getirme merkezi",
                "Ambalaj, cam ve elektronik atık için mahalle getirme noktası. Konteyner sahası betonlandı.",
                """
                Bolluca’da ambalaj, cam, tekstil ve küçük elektronik atık için getirme merkezi kurulur. Konteyner oturumu ve aydınlatma tamamlanmak üzeredir.

                Vatandaş randevusuz bırakır; evsel atık alınmaz. Kurgusal çevre tesisi kaydıdır.

                Durum: Devam ediyor
                İlerleme: %68
                Bütçe: 4,8 milyon ₺ (demo)
                Yüklenici: Çevre Koruma — kurgusal yük
                Bağlantı: /talepler
                """,
                "Bolluca",
                "Çevre",
                DemoMonthUtc(-7),
                DemoMonthUtc(1),
                12),
            (
                "faaliyet-karaburun-temizlik",
                "Karaburun kıyı temizlik seferberliği",
                "Kıyı bandı, piknik cepleri ve yol kenarı tarama. Yaz programı tamamlandı, sonbahar bakımı açık.",
                """
                Karaburun sahil ve piknik ceplerinde düzenli tarama, çöp konteyneri yenileme ve tabela güncellemesi yapıldı. Sonbahar döneminde ayda iki kez bakım sürer.

                Mangal yasağı tabelaları yenilendi. Kurgusal çevre programıdır.

                Durum: Tamamlandı
                İlerleme: %100
                Bütçe: 1,6 milyon ₺ (demo)
                Yüklenici: Temizlik İşleri — kurgusal yük
                Bağlantı: /talepler
                """,
                "Karaburun sahil",
                "Çevre",
                DemoMonthUtc(-5),
                DemoMonthUtc(-1),
                13),
            (
                "faaliyet-tasoluk-spor",
                "Taşoluk sentetik saha yenileme",
                "Halı saha zemin, aydınlatma direği ve soyunma kabini. Randevu sistemi teslimden sonra açılır.",
                """
                Taşoluk spor alanındaki sentetik çim, çevre filesi ve LED projektör yenilenir. Soyunma kabini ve su noktası eklenir.

                Teslim sonrası saatlik randevu spor ekranından alınır. Kurgusal spor yatırımındır.

                Durum: Devam ediyor
                İlerleme: %51
                Bütçe: 7,4 milyon ₺ (demo)
                Yüklenici: Spor İşleri — kurgusal yük
                Bağlantı: /spor-randevu
                """,
                "Taşoluk spor alanı",
                "Spor",
                DemoMonthUtc(-3),
                DemoMonthUtc(4),
                14),
            (
                "faaliyet-bogazkoy-genclik",
                "Boğazköy gençlik merkezi",
                "Kondisyon salonu, stüdyo ve açık basket potası. Proje ruhsatı alındı, ihale hazırlığı sürüyor.",
                """
                Boğazköy’de gençlik merkezi olarak kondisyon salonu, ritim stüdyosu ve açık basket potası planlanır. Ruhsat alındı; ihale dokümanı hazırlanır.

                Kurs programı teslim yılında kültür ve spor birimlerinden yayınlanır. Kurgusal gençlik tesisi kaydıdır.

                Durum: Planlama
                İlerleme: %15
                Bütçe: 19,5 milyon ₺ (demo)
                Yüklenici: Gençlik ve Spor — kurgusal birim
                Bağlantı: /spor-randevu
                """,
                "Boğazköy spor alanı",
                "Spor",
                DemoMonthUtc(4),
                DemoMonthUtc(18),
                15),
            (
                "faaliyet-kultur-fuaye",
                "Kültür Merkezi fuaye yenileme",
                "Fuaye zemin, oturma ve sergi rayları tamamlandı. Salon girişi yeniden düzenlendi.",
                """
                Kültür Merkezi fuayesinde zemin kaplama, banklar ve sergi rayı yenilendi. Giriş holü genişletildi; yönlendirme tabelaları güncellendi.

                Tesis günlük programa açıktır. Kayıt kurgusal tamamlanmış yatırımdır.

                Durum: Tamamlandı
                İlerleme: %100
                Bütçe: 9,7 milyon ₺ (demo)
                Yüklenici: Kültür ve Sosyal İşler — kurgusal yük
                Bağlantı: /kultur
                """,
                "Arnavutköy Kültür Merkezi",
                "Kültür",
                DemoMonthUtc(-14),
                DemoMonthUtc(-1),
                16),
            (
                "faaliyet-tasoluk-atolyesi",
                "Taşoluk bilim ve kodlama atölyesi",
                "9–14 yaş blok kodlama ve robotik deneme sınıfı. Donanım alımı bitti, eğitim takvimi sonbaharda açılır.",
                """
                Taşoluk bilim atölyesinde 16 kişilik sınıf, blok tabanlı kodlama seti ve basit robotik kitleri kurulur. Veliler ilk oturuma refakat eder.

                Kayıt kurgusal eğitim yatırımındır; gerçek müfredat duyurusu değildir.

                Durum: Devam ediyor
                İlerleme: %58
                Bütçe: 3,1 milyon ₺ (demo)
                Yüklenici: Eğitim ve Kurslar — kurgusal birim
                Bağlantı: /hizmet-rehberi
                """,
                "Taşoluk bilim atölyesi",
                "Eğitim",
                DemoMonthUtc(-4),
                DemoMonthUtc(2),
                17),
            (
                "faaliyet-kadin-aile",
                "Kadın ve aile danışma noktası",
                "Merkez’de danışma, hukuk yönlendirme ve çocuk oyun köşesi. Personel alımı tamamlandı, iç düzen sürüyor.",
                """
                Merkez mahallede kadın ve aile danışma noktası açılır. Hukuk yönlendirme, sosyal inceleme randevusu ve çocuk oyun köşesi bulunur.

                Başvurular sosyal yardım ekranı üzerinden de yönlendirilir. Kurgusal aile hizmeti kaydıdır.

                Durum: Devam ediyor
                İlerleme: %44
                Bütçe: 5,6 milyon ₺ (demo)
                Yüklenici: Kadın ve Aile Hizmetleri — kurgusal birim
                Bağlantı: /yardim
                """,
                "Arnavutköy Merkez",
                "Aile",
                DemoMonthUtc(-2),
                DemoMonthUtc(5),
                18),
            (
                "faaliyet-haracci-kentsel",
                "Haraççı kentsel dönüşüm etüdü",
                "Riskli yapı envanteri, parsel birleştirme ve sosyal donatı notu. Askı süreci 2026 sonuna planlandı.",
                """
                Haraççı’da riskli yapı envanteri, parsel birleştirme senaryosu ve sosyal donatı ihtiyacı etüt edilir. Askı ve kamuoyu toplantısı 2026 sonuna bırakılır.

                İmar harç ekranı ile karıştırılmamalıdır; bu kayıt plan notudur. Kurgusal şehircilik çalışmasıdır.

                Durum: Planlama
                İlerleme: %9
                Bütçe: Etüt ve danışmanlık (demo)
                Yüklenici: İmar ve Şehircilik — kurgusal birim
                Bağlantı: /imar
                """,
                "Haraççı",
                "Şehircilik",
                DemoMonthUtc(1),
                DemoMonthUtc(12),
                19),
            (
                "faaliyet-hadimkoy-vezne",
                "Hadımköy e-belediye hizmet noktası",
                "Sanayi aksında vezne, tapu yönlendirme ve başvuru kabini. Donanım kuruldu, personel eğitimi sürüyor.",
                """
                Hadımköy sanayi girişi yakınında e-belediye hizmet noktası açılır. Dijital vezne, tapu yönlendirme ve başvuru kabini bulunur.

                Açılış sonrası işlemler E-Belediye hub’ından da yürür. Kurgusal hizmet noktası kaydıdır.

                Durum: Devam ediyor
                İlerleme: %71
                Bütçe: 2,4 milyon ₺ (demo)
                Yüklenici: Mali Hizmetler — kurgusal birim
                Bağlantı: /e-belediye
                """,
                "Hadımköy",
                "Hizmet",
                DemoMonthUtc(-3),
                DemoMonthUtc(1),
                20),
        };

        var existing = await context.PortalContents
            .Where(item => item.Kind == PortalContentKind.Project)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var bySlug = existing.ToDictionary(item => item.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (bySlug.TryGetValue(draft.Slug, out var current))
            {
                await context.PortalContents
                    .Where(item => item.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Title, draft.Title)
                            .SetProperty(item => item.Summary, draft.Summary)
                            .SetProperty(item => item.Body, draft.Body)
                            .SetProperty(item => item.Location, draft.Location)
                            .SetProperty(item => item.Category, draft.Category)
                            .SetProperty(item => item.StartsAtUtc, draft.Start)
                            .SetProperty(item => item.EndsAtUtc, draft.End)
                            .SetProperty(item => item.SortOrder, draft.Order)
                            .SetProperty(item => item.IsPublished, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.PortalContents.Add(
                PortalContent.Create(
                    PortalContentKind.Project,
                    draft.Title,
                    draft.Summary,
                    draft.Body,
                    draft.Slug,
                    location: draft.Location,
                    category: draft.Category,
                    startsAtUtc: draft.Start,
                    endsAtUtc: draft.End,
                    sortOrder: draft.Order));
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static DateTime NewsUtc(int year, int month, int day) =>
        new(year, month, day, 7, 0, 0, DateTimeKind.Utc);

    private static async Task UpsertDemoNewsAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var remaps = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["haber-hadimkoy-yol"] = "haber-dalga-enerjisi",
            ["haber-tasoluk-destek"] = "haber-gurultu-bariyeri",
            ["haber-durusu-temizlik"] = "haber-dursunkoy-doga",
        };

        var existing = await context.PortalContents
            .AsNoTracking()
            .Where(item => item.Kind == PortalContentKind.News)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        foreach (var pair in remaps)
        {
            var row = existing.FirstOrDefault(item => string.Equals(item.Slug, pair.Key, StringComparison.OrdinalIgnoreCase));
            if (row is null)
            {
                continue;
            }

            var taken = existing.Any(item =>
                item.Id != row.Id &&
                string.Equals(item.Slug, pair.Value, StringComparison.OrdinalIgnoreCase));
            if (taken)
            {
                continue;
            }

            await context.PortalContents
                .Where(item => item.Id == row.Id)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.Slug, pair.Value),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        context.ChangeTracker.Clear();
        existing = await context.PortalContents
            .AsNoTracking()
            .Where(item => item.Kind == PortalContentKind.News)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var drafts = new (string Slug, string Title, string Summary, string Body, string Location, string Category, DateTime Published, int Order)[]
        {
            (
                "haber-dalga-enerjisi",
                "Karadeniz’in dalgaları Karaburun’da enerjiye dönüştü",
                "Belediye, Karaburun Limanı’nda yerli deniz dalga enerjisi üretim alanını tanıttı. Tesis 60 kW kurulu güçle sahil tesislerinin elektrik ihtiyacını karşılamayı hedefliyor.",
                """
                Arnavutköy Belediyesi, Karaburun Limanı’nda düzenlenen lansmanla Türkiye’de ilk yerli deniz dalga enerjisi elektrik üretim alanını kamuoyuna tanıttı. Program 22 Temmuz 2026 tarihinde gerçekleşti.

                ## Ne duyuruldu?
                Kurum, Karadeniz’in dalga potansiyelini elektrik enerjisine çeviren sistemin 60 kilovat kurulu güce ulaştırıldığını ve yıllık 184 bin kilovatsaat üretim hedeflendiğini açıkladı. Üretilecek enerjinin Karaburun Sosyal Tesisleri, zabıta hizmet binası, belediye hizmet noktası, Arnavutköy Kahvecisi ve sahil aydınlatmalarında kullanılması planlanıyor.

                > “Dalga enerjisinde Türkiye’ye öncü olmayı hedefliyoruz.”

                ## Sahada ne oldu?
                Protokol konuşmalarının ardından sistem devreye alındı; denizden üretilen elektrikle Karaburun sahil aydınlatmaları yakıldı. Katılımcılar üretim alanını gezerek teknik ekipten çalışma prensibini dinledi.

                Bu metin resmi haberin portföy özetidir; ihale, üretim veya fatura kaydı değildir.

                Kaynak: Arnavutköy Belediyesi
                Etiket: çevre, enerji, karaburun, teknoloji
                Faaliyet: faaliyet-karaburun-temizlik
                """,
                "Karaburun",
                "Teknoloji",
                NewsUtc(2026, 7, 22),
                1),
            (
                "haber-gurultu-bariyeri",
                "Taşoluk’ta gürültü kirliliğine çevreci bariyer",
                "Atık lastiklerin geri dönüşümüyle üretilen gürültü bariyerleri Taşoluk ve Mehmet Akif Ersoy mahallelerinde uygulanmaya başladı. Çalışma, yol kenarı gürültüsünü azaltmayı hedefliyor.",
                """
                Arnavutköy Belediyesi, 24 Temmuz 2026 tarihinde yayımladığı haberde atık araç lastiklerinin geri dönüştürülerek gürültü bariyerine dönüştürüldüğünü duyurdu. Uygulama Taşoluk ve Mehmet Akif Ersoy mahallelerinde görünür hale geldi.

                ## Ne değişiyor?
                Lastik atığı, yol kenarında ses yalıtımı sağlayan bir yüzeye dönüştürülüyor. Belediye bunu hem atık azaltımı hem de mahalle yaşam kalitesi için çift amaçlı bir çevre yatırımı olarak sunuyor.

                - Geri dönüştürülmüş lastik malzeme
                - Taşoluk ve Mehmet Akif Ersoy aksı
                - Gürültü azaltımı hedefi

                Bu özet resmi duyurunun yeniden yazımıdır; ölçüm raporu veya ihale belgesi değildir.

                Kaynak: Arnavutköy Belediyesi
                Etiket: çevre, altyapı, taşoluk
                Faaliyet: faaliyet-bolluca-atik
                """,
                "Taşoluk",
                "Çevre",
                NewsUtc(2026, 7, 24),
                50),
            (
                "haber-dursunkoy-doga",
                "Dursunköy’de lavanta ve çilek bahçesi yükseliyor",
                "Belediye, Dursunköy’de doğa rotası niteliğinde lavanta ve çilek bahçesi çalışmasına başladığını duyurdu. Hedef, kırsal peyzajı ziyaret ve tarımsal deneyim alanına dönüştürmek.",
                """
                24 Temmuz 2026 tarihli resmi habere göre Arnavutköy Belediyesi, Dursunköy’de lavanta ve çilek bahçesi yapımına başladı. Kurum, alanı İstanbul’un yeni doğa rotası olarak tanımlıyor.

                ## Bugünkü durum
                Çalışma “tamamlandı / hizmete açıldı” değil; yapımına başlandı. Bahçe, kır peyzajı, mevsimsel çiçek ve tarımsal ürün deneyimini bir araya getirmeyi hedefliyor.

                ## Neden Dursunköy?
                Mahalle, ilçenin kırsal kuzeyinde yeşil dokusuyla öne çıkar. Belediye, burayı hem yerel üretime hem de hafta sonu ziyaretine açık bir durak haline getirmeyi planladığını açıkladı.

                Kaynak: Arnavutköy Belediyesi
                Etiket: çevre, park, dursunköy, tarım
                Faaliyet: faaliyet-dursunkoy-mahalle
                Etkinlik: etkinlik-sahil
                """,
                "Dursunköy",
                "Çevre",
                NewsUtc(2026, 7, 24),
                50),
            (
                "haber-sifir-atik-mutfak",
                "Sıfır atık mutfakta karpuz kabuğu reçele dönüştü",
                "Belediyenin sıfır atık mutfak çalışmasında karpuz kabuğundan reçel üretildi. Haber, gıda israfını azaltan mutfak uygulamalarını görünür kılıyor.",
                """
                Sıfır Atık Arnavutköy, 27–28 Temmuz 2026 tarihlerinde “atık değil lezzet” başlığıyla karpuz kabuğunun reçele dönüştürüldüğü mutfak çalışmasını duyurdu.

                ## Ne anlatılıyor?
                Program, gıda israfını mutfak pratiğiyle azaltmayı amaçlıyor. Karpuz festivali ve sahil sezonunun ardından kabukların çöpe gitmesi yerine işlendiği bir atölye öne çıkarıldı.

                ## Portföy notu
                Bu sayfa resmi mutfak kaydı veya ürün satışı değildir. Yayımlanmış sıfır atık haberinin editoryal özetidir.

                Kaynak: Sıfır Atık Arnavutköy
                Etiket: çevre, sıfır atık, gıda
                """,
                "Arnavutköy",
                "Çevre",
                NewsUtc(2026, 7, 27),
                50),
            (
                "haber-15-temmuz",
                "15 Temmuz’un onuncu yılında Arnavutköy’de anma",
                "Belediye, 15 Temmuz 2026’da demokrasi ve millî irade anmasını ilçede düzenlediğini duyurdu. Program, resmi kurum haberinde “ilk günkü gibi yaşatıldı” ifadesiyle yer aldı.",
                """
                Arnavutköy Belediyesi, 15 Temmuz 2016’nın onuncu yılında ilçede anma programı düzenlediğini duyurdu. Resmi haber, 15 Temmuz ruhunun “10 yıl sonra da ilk günkü gibi yaşatıldığını” kaydeder.

                ## Ne yapıldı?
                Kurum, demokrasi nöbeti ve millî irade vurgusunu yerel bir anma programıyla sürdürdüğünü açıkladı. Ayrıntılı protokol listesi bu portföy özetinde tekrarlanmaz.

                Bu metin resmi anma haberinin kısa aktarımıdır.

                Kaynak: Arnavutköy Belediyesi
                Etiket: belediye, anma, gündem
                """,
                "Merkez",
                "Belediye",
                NewsUtc(2026, 7, 15),
                50),
            (
                "haber-mavi-bayrak",
                "Karaburun Sahili’ne Mavi Bayrak ve çevre eğitim ödülü",
                "Karaburun Sahili 2026 Uluslararası Mavi Bayrak Çevre Ödülü aldı. Belediye, aynı dönemde çevre eğitim ve bilinçlendirme ödülünü de kazandığını duyurdu.",
                """
                30 Haziran 2026 tarihli resmi habere göre Karaburun Sahili, 2026 yılı Uluslararası Mavi Bayrak Çevre Ödülü’nü aldı. Belediye ayrıca “En İyi Çevre Eğitim ve Bilinçlendirme Etkinlikleri” ödülünü Türkiye’de bu alanda ödül alan dokuz belediyeden biri, İstanbul’da ise tek belediye olarak duyurdu.

                ## Sahilde ne oldu?
                Karaburun’da Mavi Bayrak göndere çekildi; ödül takdim programı düzenlendi. Haber, sahil düzenlemesi, sıfır atık ve çevre eğitimi çalışmalarının bu sonuca bağlandığını aktarıyor.

                Kaynak: Sıfır Atık Arnavutköy
                Etiket: çevre, sahil, karaburun, mavi bayrak
                Faaliyet: faaliyet-karaburun-temizlik
                Etkinlik: etkinlik-sahil
                Duyuru: Durusu ve Terkos Sahil Temizlik Seferberliği
                """,
                "Karaburun",
                "Çevre",
                NewsUtc(2026, 6, 30),
                50),
            (
                "haber-bm-sifir-atik",
                "Arnavutköy BM Sıfır Atık Şehir Ağı’na katıldı",
                "Belediye, 29 Nisan 2026’da sıfır atık çalışmalarının uluslararası şehir ağına taşındığını duyurdu. Haber, yerel atık yönetiminin küresel iş birliği zeminine oturduğunu anlatır.",
                """
                29 Nisan 2026 tarihinde yayımlanan resmi habere göre Arnavutköy Belediyesi, Birleşmiş Milletler Sıfır Atık Şehir Ağı’nda yer aldığını açıkladı.

                ## Ne anlama geliyor?
                Kurum, ambalaj, tekstil ve diğer atık türlerinde yürüttüğü ayrıştırma ve bilinçlendirme çalışmalarını uluslararası bir öğrenme ağına bağladığını duyurdu. Ağ üyeliği, bağlayıcı bir sözleşme metni olarak bu sayfada sunulmaz.

                Kaynak: Arnavutköy Belediyesi
                Etiket: çevre, sıfır atık, uluslararası
                Faaliyet: faaliyet-bolluca-atik
                """,
                "Arnavutköy",
                "Çevre",
                NewsUtc(2026, 4, 29),
                50),
            (
                "haber-vex-robotik",
                "VEX Robotics’te Arnavutköy ekibi ABD’de yarıştı",
                "Belediye, 27 Nisan 2026’da gençlik robotik ekibinin ABD’deki VEX Robotics organizasyonuna katıldığını duyurdu. Haber, STEM ve gençlik yatırımlarının sahadaki görünür yüzüdür.",
                """
                27 Nisan 2026 tarihli resmi habere göre Arnavutköy Belediyesi destekli gençlik ekibi, VEX Robotics yarışmasında ABD’de temsil edildi.

                ## Neden önemli?
                Haber, kodlama ve robotik atölyelerinin yalnızca kurs duyurusu olmadığını; uluslararası bir sahneye taşındığını gösterir. Sonuç tablosu ve derece iddiası bu özette yer almaz; yayımlanan katılım haberi esas alınır.

                Kaynak: Arnavutköy Belediyesi
                Etiket: eğitim, gençlik, teknoloji, robotik
                Faaliyet: faaliyet-tasoluk-atolyesi
                Etkinlik: etkinlik-kodlama
                """,
                "Arnavutköy",
                "Eğitim",
                NewsUtc(2026, 4, 27),
                50),
            (
                "haber-vadipark",
                "Vadipark sosyal tesis ve ARFİT açıldı, spor tesisinin temeli atıldı",
                "17 Nisan 2026’da Vadipark Sosyal Tesis, ARFİT ve ArnaÇocuk alanlarının açıldığı; Vadipark Spor tesisi temelinin atıldığı duyuruldu.",
                """
                Arnavutköy Belediyesi, 17 Nisan 2026 tarihli haberinde Vadipark Sosyal Tesis, ARFİT ve ArnaÇocuk birimlerinin hizmete açıldığını; Vadipark Spor tesisinin ise temelinin atıldığını duyurdu.

                ## Ne açıldı, ne başladı?
                - Vadipark Sosyal Tesis — hizmete açıldı
                - ARFİT ve ArnaÇocuk — hizmete açıldı
                - Vadipark Spor — temel atıldı, henüz tamamlanmış tesis değildir

                ## Nasıl okunmalı?
                Spor tesisi için “açıldı” demek doğru olmaz. Resmi metin temel atıldığını kaydeder.

                Kaynak: Arnavutköy Belediyesi
                Etiket: spor, sosyal, vadipark
                Faaliyet: faaliyet-tasoluk-spor
                Etkinlik: etkinlik-kosu
                """,
                "Taşoluk",
                "Spor",
                NewsUtc(2026, 4, 17),
                50),
            (
                "haber-deneyap",
                "Deneyap sınavları Arnavutköy’de yapıldı",
                "13 Nisan 2026’da Deneyap teknoloji atölyeleri için sınav sürecinin ilçede yürütüldüğü duyuruldu. Haber, gençlik ve eğitim yatırımlarının başvuru takvimine bağlanır.",
                """
                13 Nisan 2026 tarihli resmi habere göre Deneyap sınavları Arnavutköy’de gerçekleştirildi. Program, teknoloji ve tasarım atölyelerine öğrenci seçimini kapsar.

                ## Kimler için?
                Deneyap, Milli Eğitim ve ilgili protokoller çerçevesinde yürütülen bir teknoloji eğitimi hattıdır. Bu sayfa sınav sonucu veya kontenjan listesi yayımlamaz.

                Kaynak: Arnavutköy Belediyesi
                Etiket: eğitim, gençlik, deneyap
                Faaliyet: faaliyet-bogazkoy-genclik
                Etkinlik: etkinlik-kodlama
                """,
                "Arnavutköy",
                "Eğitim",
                NewsUtc(2026, 4, 13),
                50),
            (
                "haber-dunya-romanlar",
                "Dünya Romanlar Günü Nuri Pakdil’de karşılandı",
                "9 Nisan 2026’da Dünya Romanlar Günü programının Nuri Pakdil kültür mekânında düzenlendiği duyuruldu. Haber, kültürel aidiyet ve sahne programını gündeme taşır.",
                """
                Arnavutköy Belediyesi, 9 Nisan 2026 tarihinde Dünya Romanlar Günü’nü Nuri Pakdil kültür alanında düzenlenen programla karşıladığını duyurdu.

                ## Ne görüldü?
                Resmi haber, müzik ve kültürel buluşmayı öne çıkarır. Bu özet, programın tamamını tekrar etmez; tarih ve mekân doğrulanmış resmi kayıttan alınır.

                Kaynak: Arnavutköy Belediyesi
                Etiket: kültür, sanat, romanlar günü
                Faaliyet: faaliyet-kultur-fuaye
                Etkinlik: etkinlik-tiyatro
                """,
                "Merkez",
                "Kültür",
                NewsUtc(2026, 4, 9),
                50),
            (
                "haber-beyaz-flama",
                "Hizmet kalitesine Beyaz Flama standardı",
                "7 Nisan 2026’da belediye, hizmet binalarında Beyaz Flama kalite standardını duyurdu. Haber, gişe ve vatandaş temas noktalarının görünür bir kalite çerçevesine alındığını anlatır.",
                """
                7 Nisan 2026 tarihli resmi habere göre Arnavutköy Belediyesi, hizmet kalitesinde “Beyaz Flama” standardını ilan etti.

                ## Ne vaat ediliyor?
                Kurum, vatandaşın temas ettiği birimlerde görünür bir kalite ve temizlik/hizmet çerçevesi uyguladığını duyurdu. Standart, bu portföy ortamında denetim belgesi yerine geçmez.

                Kaynak: Arnavutköy Belediyesi
                Etiket: belediye, hizmet, kalite
                Faaliyet: faaliyet-hadimkoy-vezne
                Duyuru: Dijital Hizmetler Platformu Yayında
                """,
                "Merkez",
                "Belediye",
                NewsUtc(2026, 4, 7),
                50),
            (
                "haber-kentsel-donusum",
                "İmrahor’da kentsel dönüşüm çalışmaları hızlandı",
                "3 Nisan 2026’da belediye, kentsel dönüşüm çalışmalarını hızlandırdığını duyurdu. Haber İmrahor ve çevresindeki yenileme gündemini aktarır; tapu işlemi doğurmaz.",
                """
                Arnavutköy Belediyesi, 3 Nisan 2026 tarihinde kentsel dönüşüm çalışmalarını hızlandırdığını açıkladı. Resmi haber, İmrahor ve bağlı aksı yenileme gündeminin parçası olarak yayımlanmıştır.

                ## Dikkat
                Bu özet hak sahipliği, kamulaştırma veya yapı ruhsatı belgesi değildir. Yayımlanmış belediye haberinin portföy aktarımıdır.

                Kaynak: Arnavutköy Belediyesi
                Etiket: imar, şehircilik, imrahor
                Faaliyet: faaliyet-haracci-kentsel
                """,
                "İmrahor",
                "İmar",
                NewsUtc(2026, 4, 3),
                50),
            (
                "haber-mobil-hizmet",
                "Mobil hizmet noktaları Merkez, Bolluca ve Karaburun’da",
                "26 Mart 2026’da belediye, mobil hizmet noktalarının Merkez, Bolluca ve Karaburun’da vatandaşa yaklaştırıldığını duyurdu.",
                """
                26 Mart 2026 tarihli resmi habere göre Arnavutköy Belediyesi, mobil hizmet noktalarını Merkez, Bolluca ve Karaburun’da konumlandırdığını duyurdu.

                ## Ne işe yarar?
                Haber, bazı gişe ve danışma işlemlerinin mahalle ölçeğine taşındığını anlatır. Bu platformdaki e-belediye akışları kurgusal demodu; mobil nokta listesi resmi randevu sistemi değildir.

                Kaynak: Arnavutköy Belediyesi
                Etiket: belediye, hizmet, dijital
                Faaliyet: faaliyet-hadimkoy-vezne
                Duyuru: Dijital Hizmetler Platformu Yayında
                """,
                "Merkez",
                "Belediye",
                NewsUtc(2026, 3, 26),
                50),
            (
                "haber-olimpik-spor",
                "Olimpik spor kompleksi için protokol imzalandı",
                "16 Mart 2026’da olimpik ölçekli spor kompleksi protokolü duyuruldu. Tesis henüz tamamlanmış bir yapı olarak sunulmaz.",
                """
                Arnavutköy Belediyesi, 16 Mart 2026 tarihinde olimpik spor kompleksi için protokol imzalandığını duyurdu.

                ## Bugünkü durum
                Haber bir niyet ve iş birliği eşiğidir. Kompleksin açıldığı anlamına gelmez. Bu özet, “protokol imzalandı” kaydını korur.

                Kaynak: Arnavutköy Belediyesi
                Etiket: spor, yatırım, protokol
                Faaliyet: faaliyet-tasoluk-spor
                """,
                "Arnavutköy",
                "Spor",
                NewsUtc(2026, 3, 16),
                50),
            (
                "haber-yks-destek",
                "YKS ücret desteği gençlerin yanında",
                "2 Mart 2026’da belediye, üniversite sınavı ücretine yönelik destek haberini yayımladı. Başvuru koşulları resmi kurum kanalından doğrulanmalıdır.",
                """
                2 Mart 2026 tarihli resmi habere göre Arnavutköy Belediyesi, YKS ücret desteğiyle gençlerin yanında olduğunu duyurdu.

                ## Nasıl okunmalı?
                Bu sayfa başvuru formu değildir. Destek kapsamı, tarih ve belgeler resmi belediye duyurusundan teyit edilmelidir. Portföy ortamı ödeme üretmez.

                Kaynak: Arnavutköy Belediyesi
                Etiket: eğitim, gençlik, sosyal destek
                Duyuru: Taşoluk Sosyal Yardım Başvuru Günleri
                """,
                "Arnavutköy",
                "Eğitim",
                NewsUtc(2026, 3, 2),
                50),
            (
                "haber-mobil-mamografi",
                "Mobil mamografi aracı mahallelerde tarama yaptı",
                "2 Mart 2026’da belediye, mobil mamografi hizmetinin sahada olduğunu duyurdu. Haber sağlık taramasını gündeme taşır; randevu sistemi bu sitede yoktur.",
                """
                Arnavutköy Belediyesi, 2 Mart 2026 tarihinde mobil mamografi aracının mahallelerde tarama yaptığını duyurdu.

                ## Sağlık notu
                Bu özet tıbbi sonuç veya randevu kaydı değildir. Yayımlanmış belediye haberinin aktarımıdır. Randevu ve sonuç için resmi sağlık kanalları kullanılır.

                Kaynak: Arnavutköy Belediyesi
                Etiket: sağlık, tarama, kadın
                """,
                "Arnavutköy",
                "Sağlık",
                NewsUtc(2026, 3, 2),
                50),
            (
                "haber-secap",
                "SECAP lansmanı: 2030 için iklim eylem planı açıklandı",
                "12 Ocak 2026’da Sürdürülebilir Enerji ve İklim Eylem Planı (SECAP) paydaşların katıldığı lansmanla duyuruldu. Plan, yüzde 55 emisyon azaltım hedefini çatı olarak koyar.",
                """
                12 Ocak 2026’da Arnavutköy Belediyesi, Sürdürülebilir Enerji ve İklim Eylem Planı’nı (SECAP) lansmanla kamuoyuna sundu.

                ## Plan neyi kapsıyor?
                Resmi habere göre binalar, yenilenebilir enerji, ulaşım, atık ve atık su sektörlerinde uyum ve azaltım eylemleri belirlendi. 2030 perspektifinde en az yüzde 55 emisyon azaltımı çatı hedef olarak açıklandı.

                ## Dalga enerjisiyle bağı
                Lansman, Karadeniz’de dalgadan elektrik üretimine yönelik hazırlığın iklim yol haritasının parçası olduğunu vurgular. Karaburun üretim alanı daha sonra, 22 Temmuz 2026’da tanıtıldı.

                Kaynak: Sıfır Atık Arnavutköy
                Etiket: çevre, enerji, iklim, secap
                Faaliyet: faaliyet-karaburun-temizlik
                """,
                "Merkez",
                "Çevre",
                NewsUtc(2026, 1, 12),
                50),
        };

        var keep = drafts.Select(draft => draft.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var bySlug = existing.ToDictionary(item => item.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (bySlug.TryGetValue(draft.Slug, out var current))
            {
                await context.PortalContents
                    .Where(item => item.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Title, draft.Title)
                            .SetProperty(item => item.Summary, draft.Summary)
                            .SetProperty(item => item.Body, draft.Body)
                            .SetProperty(item => item.Location, draft.Location)
                            .SetProperty(item => item.Category, draft.Category)
                            .SetProperty(item => item.StartsAtUtc, draft.Published)
                            .SetProperty(item => item.EndsAtUtc, (DateTime?)null)
                            .SetProperty(item => item.SortOrder, draft.Order)
                            .SetProperty(item => item.IsPublished, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.PortalContents.Add(
                PortalContent.Create(
                    PortalContentKind.News,
                    draft.Title,
                    draft.Summary,
                    draft.Body,
                    draft.Slug,
                    location: draft.Location,
                    category: draft.Category,
                    startsAtUtc: draft.Published,
                    sortOrder: draft.Order));
        }

        var leftovers = existing.Where(item => !keep.Contains(item.Slug)).Select(item => item.Id).ToList();
        if (leftovers.Count > 0)
        {
            await context.PortalContents
                .Where(item => leftovers.Contains(item.Id))
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.IsPublished, false),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static async Task UpsertDemoCultureVenuesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var remaps = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["kultur-merkezi"] = "kultur-avlu34",
            ["durusu-amfi"] = "kultur-nuri-pakdil",
        };

        var existing = await context.PortalContents
            .AsNoTracking()
            .Where(item => item.Kind == PortalContentKind.CultureVenue)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        foreach (var pair in remaps)
        {
            var row = existing.FirstOrDefault(item => string.Equals(item.Slug, pair.Key, StringComparison.OrdinalIgnoreCase));
            if (row is null)
            {
                continue;
            }

            var taken = existing.Any(item =>
                item.Id != row.Id &&
                string.Equals(item.Slug, pair.Value, StringComparison.OrdinalIgnoreCase));
            if (taken)
            {
                continue;
            }

            await context.PortalContents
                .Where(item => item.Id == row.Id)
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.Slug, pair.Value),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        context.ChangeTracker.Clear();
        existing = await context.PortalContents
            .AsNoTracking()
            .Where(item => item.Kind == PortalContentKind.CultureVenue)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var drafts = new (string Slug, string Title, string Summary, string Body, string Location, string Category, int Order)[]
        {
            (
                "kultur-avlu34",
                "Arnavutköy Kültür ve Sanat Merkezi (Avlu34)",
                "Avlu 34 yaşam merkezi içindeki 250 kişilik konferans ve tiyatro salonu. Sahne, ses ve ışık altyapısıyla tiyatro, konferans ve sinema programına açıktır.",
                """
                Avlu 34 Alışveriş ve Yaşam Merkezi içinde yer alan belediye kültür salonu, resmi tesis sayfasına göre 250 kişilik konferans ve tiyatro kapasitesine sahiptir. Sahne ölçeği, ses, görüntü ve ışık sistemi konferans, tiyatro ve sinema gösterimine uygun tanımlanır.

                ## Mekân
                Tesis, ilçe merkezindeki Avlu34 yapı kompleksinin kültür katmanıdır. Aynı çatıda çocuk atölyesi ve diğer sosyal birimler de yer alır; bu kayıt yalnızca salon ve sahne işlevini özetler.

                ## Nasıl okunmalı
                Program takvimi bu portföy ortamında canlı bilet sistemi değildir. Yaklaşan kayıtlar, platformdaki etkinlik verisinden bağlanır.

                Kaynak: Arnavutköy Belediyesi
                Adres: Arnavutköy Merkez Mah. Eski Edirne Cad. No: 1405A
                Hizmet: Konferans, tiyatro, sinema
                Etkinlik: etkinlik-ritim
                """,
                "Merkez",
                "Kültür merkezi",
                1),
            (
                "kultur-nuri-pakdil",
                "Nuri Pakdil Kültür ve Sanat Merkezi",
                "Taşoluk’ta 650 kişilik konferans ve tiyatro salonu ile 350 kişilik çok amaçlı salonu bulunan kültür kompleksi. Sanat Akademisi 2018’den beri bu çatı altındadır.",
                """
                Nuri Pakdil Kültür ve Sanat Merkezi, Taşoluk Mahallesi Kazım Karabekir Caddesi’nde hizmet verir. Resmi tesis metnine göre yapıda 350 kişilik çok amaçlı salon ve 650 kişilik konferans–tiyatro salonu bulunur.

                ## Sahne
                Tiyatro salonu iki katlı seyirci alanı ve 320 metrekare sahne ile tanımlanır. Akustik ve sahne asansörü, ulusal ve uluslararası kültür programlarına ev sahipliği hedefiyle anlatılır.

                ## Bağlantılı birimler
                Sanat Akademisi 2018 Eylül’den itibaren bu merkezde faaliyet yürütür. Millet kütüphanesi de resmi kültür tesisleri listesinde bu kompleksle birlikte anılır.

                Kaynak: Arnavutköy Belediyesi
                Adres: Taşoluk Mah. Kazım Karabekir Cad. No: 88/1
                Telefon: 0 (212) 682 04 08
                Hizmet: Tiyatro, konferans, çok amaçlı salon
                Etkinlik: etkinlik-tiyatro
                Haber: haber-dunya-romanlar
                """,
                "Taşoluk",
                "Sahne",
                2),
            (
                "kultur-cocuk-atolye",
                "Arnavutköy Çocuk Atölyesi",
                "Avlu34 içinde, 48 ay–12 yaş aralığına ücretsiz atölye programı sunan birim. Hayal gücü, paylaşım ve aile katılımlı çalışmalara odaklanır.",
                """
                Resmi tesis sayfasına göre Çocuk Atölyesi, teknolojinin aile içindeki ağırlığını dengelemek üzere 48 ay–12 yaş çocuklara ücretsiz atölyeler planlar. Ebeveyn–çocuk atölyeleri ve psikolojik danışmanlık imkânı metinde yer alır.

                ## Adres
                Avlu34 içinde İç Kapı No: 20 olarak yayımlanmıştır.

                Kaynak: Arnavutköy Belediyesi
                Adres: Arnavutköy Merkez Mahallesi, Eski Edirne Asfaltı Caddesi, No: 1405A, İç Kapı No: 20
                Hizmet: Çocuk atölyesi, ebeveyn–çocuk programı
                """,
                "Merkez",
                "Atölye",
                3),
            (
                "kultur-kadin",
                "Kadın Kültür ve Sanat Merkezi",
                "Merkez Mahallesi Tahtakale Sokak’taki kadın kültür ve sanat birimi. Konferans salonu ayrı bir tesis kaydı olarak da yayımlanır.",
                """
                Kadın Kültür ve Sanat Merkezi, resmi tesis dizininde Merkez Mahallesi Tahtakale Sokak No: 3 adresinde yer alır. Konferans salonu aynı sokakta No: 3/5 olarak ayrıca listelenir.

                ## İletişim
                Resmi sayfada 0212 597 10 97 numarası yayımlanmıştır. Çalışma saati bu özetin kaynağında yer almaz.

                Kaynak: Arnavutköy Belediyesi
                Adres: Merkez Mah. Tahtakale Sok. No: 3
                Telefon: 0212 597 10 97
                Hizmet: Kadın kültür programı, konferans
                """,
                "Merkez",
                "Sanat alanı",
                4),
            (
                "kultur-millet-kiraathane",
                "Millet Kıraathanesi ve Şehir Kütüphanesi",
                "Merkez’de 20.000 kitaplık millet kıraathanesi ve şehir kütüphanesi. Eski Edirne Caddesi üzerindeki resmi kütüphane kaydıdır.",
                """
                Arnavutköy Millet Kıraathanesi ve Şehir Kütüphanesi, resmi tesis sayfasına göre 20.000 kitaptan oluşan koleksiyonuyla Merkez’de hizmet verir.

                Kaynak: Arnavutköy Belediyesi
                Adres: Arnavutköy Merkez Mah. Eski Edirne Cad. No: 1388
                Telefon: 444 4 597
                Hizmet: Kütüphane, kıraathane
                """,
                "Merkez",
                "Kütüphane",
                5),
            (
                "kultur-cahit-zarifoglu",
                "Cahit Zarifoğlu Millet Kütüphanesi",
                "Anadolu Mahallesi’nde, Yedi Güzel Adam’dan Cahit Zarifoğlu adına 4.500 kitaplık millet kütüphanesi.",
                """
                Belediye, Anadolu Mahallesi’nde Cahit Zarifoğlu Millet Kütüphanesi’ni kişisel gelişim, felsefe, edebiyat ve tarih ağırlıklı 4.500 kitaplık bir koleksiyon olarak yayımlar.

                Kaynak: Arnavutköy Belediyesi
                Adres: Anadolu Mah. Mimar Sinan Cad. No: 24
                Telefon: 0212 597 66 22
                Hizmet: Millet kütüphanesi
                """,
                "Anadolu",
                "Kütüphane",
                6),
            (
                "kultur-sanat-akademisi",
                "Sanat Akademisi",
                "2015’te kurulan, 2018’den beri Nuri Pakdil Kültür ve Sanat Merkezi’nde faaliyet gösteren kültür işleri birimi.",
                """
                Sanat Akademisi, resmi metne göre 2015 Aralık’ta kuruldu; 2018 Eylül’den itibaren Nuri Pakdil Kültür ve Sanat Merkezi içinde sanatsal ve eğitsel faaliyet yürütür. Güzel sanatlar ve konservatuvar hazırlık çizgisi tarihçede anılır.

                ## Konum
                Ayrı bir cadde adresi yayımlanmaz; akademi Nuri Pakdil kompleksi içindedir.

                Kaynak: Arnavutköy Belediyesi
                Adres: Taşoluk Mah. Kazım Karabekir Cad. No: 88/1 (Nuri Pakdil Kültür ve Sanat Merkezi)
                Hizmet: Sanat eğitimi, resital ve atölye
                Haber: haber-dunya-romanlar
                """,
                "Taşoluk",
                "Akademi",
                7),
            (
                "kultur-yerel-tarih",
                "Arnavutköy Yerel Tarih Müzesi",
                "Hastane Mahallesi’ndeki tarihi Hadımköy Tren İstasyonu sahasında 20 Mayıs 2022’de açılan yerel tarih müzesi.",
                """
                Yerel Tarih Müzesi, resmi içerik sayfasına göre 20 Mayıs 2022’de ziyarete açıldı. Hastane Mahallesi Özcan Taşkınbaş Caddesi üzerindeki tarihi tren istasyonu sahasındadır.

                ## Yapı
                Hadımköy Tren İstasyonu, 1872’de Sultan Abdülaziz döneminde Doğu Avrupa ve Rumeli Demiryolları hattının parçası olarak inşa edilmiştir. Belediye restorasyonunun ardından istasyon yapılarından biri müze işlevi kazanmıştır.

                Kaynak: Arnavutköy Belediyesi
                Adres: Hastane Mahallesi, Özcan Taşkınbaş Caddesi — Tarihi Tren İstasyonu sahası
                Hizmet: Yerel tarih sergisi
                """,
                "Hastane",
                "Müze",
                8),
        };

        var keep = drafts.Select(draft => draft.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var bySlug = existing.ToDictionary(item => item.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (bySlug.TryGetValue(draft.Slug, out var current))
            {
                await context.PortalContents
                    .Where(item => item.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Title, draft.Title)
                            .SetProperty(item => item.Summary, draft.Summary)
                            .SetProperty(item => item.Body, draft.Body)
                            .SetProperty(item => item.Location, draft.Location)
                            .SetProperty(item => item.Category, draft.Category)
                            .SetProperty(item => item.SortOrder, draft.Order)
                            .SetProperty(item => item.IsPublished, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.PortalContents.Add(
                PortalContent.Create(
                    PortalContentKind.CultureVenue,
                    draft.Title,
                    draft.Summary,
                    draft.Body,
                    draft.Slug,
                    location: draft.Location,
                    category: draft.Category,
                    sortOrder: draft.Order));
        }

        var leftovers = existing.Where(item => !keep.Contains(item.Slug)).Select(item => item.Id).ToList();
        if (leftovers.Count > 0)
        {
            await context.PortalContents
                .Where(item => leftovers.Contains(item.Id))
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.IsPublished, false),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string ServiceGuideBody(
        string intro,
        string purpose,
        string who,
        string how,
        string route,
        string kind,
        string cta,
        bool online,
        bool requiresAuth,
        string keywords,
        string scenario,
        string steps,
        string related)
    {
        return $"""
            {intro}

            ## Ne için kullanılır?
            {purpose}

            ## Kimler kullanabilir?
            {who}

            ## Nasıl yapılır?
            {how}

            Rota: {route}
            Tür: {kind}
            CTA: {cta}
            Online: {(online ? "Evet" : "Hayır")}
            Giriş: {(requiresAuth ? "Evet" : "Hayır")}
            Anahtar: {keywords}
            Senaryo: {scenario}
            Adımlar: {steps}
            İlgili: {related}
            """;
    }

    private static async Task UpsertDemoServiceGuidesAsync(ApplicationDbContext context, CancellationToken cancellationToken)
    {
        var existing = await context.PortalContents
            .AsNoTracking()
            .Where(item => item.Kind == PortalContentKind.ServiceGuide)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var drafts = new (string Slug, string Title, string Summary, string Body, string Location, string Category, int Order)[]
        {
            (
                "rehber-vergi",
                "Vergi ödeme",
                "Açık borç ve kart bakiyesi için dijital vezne.",
                ServiceGuideBody(
                    "Emlak ve su borçlarınızı bu projedeki dijital vezne üzerinden örnek ortamda ödeyebilirsiniz. Gerçek tahsilat yoktur.",
                    "Açık borcu seçip demo kart bilgisiyle ödeme adımını denemek için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Dijital vezneye gidin, listelenen borcu seçin ve demo ödemeyi tamamlayın.",
                    "/vezne",
                    "Ödeme",
                    "Dijital Vezneye Git",
                    true,
                    true,
                    "vergi, ödeme, vezne, emlak, su, kart, bakiye",
                    "Vergimi ödemek istiyorum",
                    "Hizmeti seçin | Giriş yapın | Borcu seçin | Demo ödemeyi tamamlayın",
                    "rehber-borc, rehber-takip"),
                "Giriş gerekir",
                "Mali işlemler",
                1),
            (
                "rehber-borc",
                "Borç sorgulama",
                "Su ve emlak borçlarını hesabınız üzerinden görün.",
                ServiceGuideBody(
                    "Borç listesi, giriş yapmış vatandaşın örnek su ve emlak kayıtlarını gösterir. Resmi tahakkuk belgesi değildir.",
                    "Ödenmemiş borçları görmek ve ardından vezneye geçmek için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Borçlarım sayfasını açın; ödemek isterseniz dijital vezneye geçin.",
                    "/borclar",
                    "Sorgulama",
                    "Borçlarımı Aç",
                    true,
                    true,
                    "borç, vergi, emlak, su, ödenmedi, sorgula",
                    "Borcumu öğrenmek istiyorum",
                    "Hizmeti seçin | Giriş yapın | Borç listesini görün | Gerekirse vezneye geçin",
                    "rehber-vergi, rehber-belge"),
                "Giriş gerekir",
                "Mali işlemler",
                2),
            (
                "rehber-takip",
                "Başvuru takibi",
                "BV-, SP- veya NK- kodu ile belge, spor ve nikah durumunu sorun.",
                ServiceGuideBody(
                    "Başvuru takibi, işlem sonunda verilen kodla belge, spor ve nikah kayıtlarının durumunu gösterir. Giriş zorunlu değildir.",
                    "Açık bir başvurunun hangi aşamada olduğunu öğrenmek için kullanılır.",
                    "Kod elinde olan herkes; kod işlem sayfalarında üretilir.",
                    "Kodu başvuru takip alanına yazın. Sonuç bulunamazsa kodu ve işlem türünü kontrol edin.",
                    "/basvuru-takip",
                    "Takip",
                    "Başvuru Takibini Aç",
                    true,
                    false,
                    "takip, kod, bv, sorgula, durum, başvuru",
                    "Başvurumun durumunu öğrenmek istiyorum",
                    "Takip kodunuzu alın | Başvuru takibine gidin | Kodu girin | Durumu görün",
                    "rehber-belge, rehber-nikah, rehber-spor"),
                "Online işlem",
                "Başvuru & belgeler",
                3),
            (
                "rehber-belge",
                "Belge başvurusu",
                "İkametgâh, borç yoktur ve imar belgesi talebi (demo).",
                ServiceGuideBody(
                    "Belge başvurusu, bu projedeki örnek evrak türlerinden birini seçerek kayıt açmanızı sağlar. Resmi evrak üretmez; ücret bu demoda yayımlanmaz.",
                    "Yeni bir belge talebi oluşturmak için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Belge türünü seçin, başvuruyu gönderin ve size verilen kodla durumu takip edin.",
                    "/basvurular",
                    "Belge",
                    "Belge Başvurusunu Aç",
                    true,
                    true,
                    "belge, ikametgah, ikametgâh, borç yoktur, ruhsat, başvuru",
                    "Belge başvurusu yapmak istiyorum",
                    "Hizmeti seçin | Giriş yapın | Belge türünü seçin | Kodu ile takip edin",
                    "rehber-takip, rehber-imar"),
                "Giriş gerekir",
                "Başvuru & belgeler",
                4),
            (
                "rehber-imar",
                "İmar durumu sorgulama",
                "Ada ve parsel ile imar kaydı ve harç hesabı (demo parsel).",
                ServiceGuideBody(
                    "İmar sorgusu, seed edilmiş demo parseller üzerinden kayıt ve harç hesabı gösterir. Resmi imar belgesi değildir; harç tutarı yalnızca örnek hesaptır.",
                    "Ada/parsel ile imar kaydını görmek ve örnek harç hesabını denemek için kullanılır.",
                    "Giriş olmadan da sorgulanabilir.",
                    "İmar sayfasında ada ve parsel girin. Demo örnekler: 45/8 Hadımköy, 12/3 Merkez, 7/21 Taşoluk.",
                    "/imar",
                    "Sorgulama",
                    "İmar Sorgulamayı Aç",
                    true,
                    false,
                    "imar, ada, parsel, harç, şehircilik, arsa",
                    "İmar durumunu öğrenmek istiyorum",
                    "Hizmeti seçin | Ada ve parseli girin | Sonucu görün | Gerekirse belgeye geçin",
                    "rehber-belge, rehber-takip"),
                "Online işlem",
                "İmar & şehircilik",
                5),
            (
                "rehber-nikah",
                "Nikah randevusu",
                "Salon ve saat seçerek kurgusal nikah randevusu alın.",
                ServiceGuideBody(
                    "Nikah işlemleri, örnek salon kontenjanından saat seçmenizi sağlar. Resmi evlendirme kaydı değildir.",
                    "Nikah salonu ve saat randevusu denemek için kullanılır.",
                    "Randevu formu herkese açıktır; oluşan kodla takip edilir.",
                    "Uygun saati seçin, bilgilerinizi girin ve size verilen NK- kodunu saklayın.",
                    "/nikah",
                    "Randevu",
                    "Nikah İşlemlerine Git",
                    true,
                    false,
                    "nikah, düğün, salon, evlilik, randevu, aile",
                    "Nikah için randevu almak istiyorum",
                    "Hizmeti seçin | Uygun saati bulun | Randevuyu tamamlayın | Kodu saklayın",
                    "rehber-takip, rehber-iletisim"),
                "Online işlem",
                "Nikah & aile",
                6),
            (
                "rehber-spor",
                "Spor tesisi randevusu",
                "Salon, halı saha ve havuz için saatlik randevu.",
                ServiceGuideBody(
                    "Spor randevusu, seed edilmiş tesislerde saatlik kontenjan gösterir. Kapasite dolunca başka slot seçilir.",
                    "Halı saha, salon veya havuz saati ayırtmak için kullanılır.",
                    "Randevu formu herkese açıktır; oluşan kodla takip edilir.",
                    "Tesis ve saati seçin, randevuyu tamamlayın, SP- kodunu saklayın.",
                    "/spor-randevu",
                    "Randevu",
                    "Spor Randevusuna Git",
                    true,
                    false,
                    "spor, randevu, saha, havuz, tesis, salon",
                    "Spor tesisi için randevu almak istiyorum",
                    "Hizmeti seçin | Tesisi seçin | Saati ayırtın | Kodu saklayın",
                    "rehber-takip, rehber-ulasim"),
                "Online işlem",
                "Spor",
                7),
            (
                "rehber-talep",
                "Talep ve öneri",
                "Şikâyet, öneri ve talep kaydı açın; durumunu panelden izleyin.",
                ServiceGuideBody(
                    "Talep kaydı, bu projedeki vatandaş talep kategorilerinden birini seçerek örnek bildirim oluşturur.",
                    "Şikâyet, öneri veya mahalle talebi iletmek için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Kategoriyi seçin, kaydı gönderin ve panelden durumunu izleyin.",
                    "/talepler",
                    "Başvuru",
                    "Talep Formunu Aç",
                    true,
                    true,
                    "talep, öneri, şikayet, şikâyet, destek",
                    "Belediyeye talep veya öneri iletmek istiyorum",
                    "Hizmeti seçin | Giriş yapın | Kategoriyi seçin | Kaydı gönderin",
                    "rehber-yardim, rehber-iletisim"),
                "Giriş gerekir",
                "Sosyal hizmetler",
                8),
            (
                "rehber-yardim",
                "Sosyal yardım",
                "Sosyal destek başvurusu için vatandaş işlem alanı.",
                ServiceGuideBody(
                    "Sosyal yardım sayfası, bu projedeki örnek destek başvurusunu açar. Resmi yardım kriteri veya ödeme tutarı yayımlanmaz.",
                    "Sosyal destek formuna ulaşmak için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Yardım sayfasını açın ve formdaki adımları izleyin.",
                    "/yardim",
                    "Başvuru",
                    "Sosyal Yardımı Aç",
                    true,
                    true,
                    "sosyal, yardım, destek, ihtiyaç",
                    "Sosyal yardım başvurusu yapmak istiyorum",
                    "Hizmeti seçin | Giriş yapın | Formu doldurun | Sonucu takip edin",
                    "rehber-talep, rehber-iletisim"),
                "Giriş gerekir",
                "Sosyal hizmetler",
                9),
            (
                "rehber-ulasim",
                "Ulaşım ağı",
                "Hat tablosu, kart ve biniş işlemlerinin ortak girişi.",
                ServiceGuideBody(
                    "Ulaşım ağı, bu projedeki hat listesi, kart ve biniş simülasyonunun ortak girişidir.",
                    "Hangi ulaşım işlemine gideceğinizi seçmek için kullanılır.",
                    "Keşif herkese açıktır; kart bakiyesi için giriş gerekir.",
                    "Ulaşım ağına gidin, hat, kart veya biniş işleminden birini seçin.",
                    "/ulasim-agi",
                    "Sorgulama",
                    "Ulaşım Ağını Aç",
                    true,
                    false,
                    "ulaşım, hat, otobüs, kart, biniş",
                    "Ulaşım işlemlerini görmek istiyorum",
                    "Hizmeti seçin | İhtiyacınız olan işlemi bulun | Hat veya karta geçin | Sonucu görün",
                    "rehber-hatlar, rehber-ulasim-kart"),
                "Online işlem",
                "Ulaşım",
                10),
            (
                "rehber-hatlar",
                "Otobüs hatları",
                "Güzergâh, durak ve hareket saatleri.",
                ServiceGuideBody(
                    "Hat listesi, bu projedeki örnek otobüs güzergâhlarını gösterir. Canlı sefer verisi değildir.",
                    "Hat, durak ve saat bilgisine bakmak için kullanılır.",
                    "Giriş olmadan da incelenebilir.",
                    "Hatlar sayfasından bir hattı açın ve güzergâhı inceleyin.",
                    "/hatlar",
                    "Sorgulama",
                    "Hat Listesini Aç",
                    true,
                    false,
                    "hat, otobüs, durak, saat, ulaşım",
                    "Otobüs hattını öğrenmek istiyorum",
                    "Hizmeti seçin | Hattı bulun | Güzergâhı inceleyin | Gerekirse ağa dönün",
                    "rehber-ulasim, rehber-ulasim-kart"),
                "Online işlem",
                "Ulaşım",
                11),
            (
                "rehber-ulasim-kart",
                "Ulaşım kartı",
                "Kart bakiyesi ve işlemleri (giriş gerekir).",
                ServiceGuideBody(
                    "Ulaşım kartı sayfası, giriş yapmış kullanıcının örnek kart bakiyesini gösterir. Gerçek yükleme yoktur.",
                    "Kart bakiyesini görmek için kullanılır.",
                    "Demo vatandaş hesabıyla giriş yapan kullanıcılar.",
                    "Ulaşım kartı sayfasını açın; bakiye ve işlemler hesabınıza bağlıdır.",
                    "/ulasim",
                    "Sorgulama",
                    "Ulaşım Kartını Aç",
                    true,
                    true,
                    "kart, bakiye, ulaşım, yükle",
                    "Ulaşım kartı bakiyemi görmek istiyorum",
                    "Hizmeti seçin | Giriş yapın | Bakiyeyi görün | Gerekirse ağa dönün",
                    "rehber-ulasim, rehber-hatlar"),
                "Giriş gerekir",
                "Ulaşım",
                12),
            (
                "rehber-iletisim",
                "İletişim",
                "Yazışma formu ve demo çağrı hattı.",
                ServiceGuideBody(
                    "İletişim sayfası, örnek yazışma formu ve demo çağrı bilgisini içerir. Resmi kurum hattı değildir.",
                    "Genel soru, yönlendirme ve yazışma için kullanılır.",
                    "Form herkese açıktır.",
                    "İletişim formunu doldurun veya rehberdeki ilgili işleme dönün.",
                    "/iletisim",
                    "Destek",
                    "İletişim Formunu Aç",
                    true,
                    false,
                    "iletişim, telefon, mesaj, çağrı, destek",
                    "Belediyeye yazmak istiyorum",
                    "Hizmeti seçin | Konuyu yazın | Formu gönderin | Gerekirse talebe geçin",
                    "rehber-talep, rehber-takip"),
                "Online işlem",
                "Destek",
                13),
        };

        var keep = drafts.Select(draft => draft.Slug).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var bySlug = existing.ToDictionary(item => item.Slug, StringComparer.OrdinalIgnoreCase);

        foreach (var draft in drafts)
        {
            if (bySlug.TryGetValue(draft.Slug, out var current))
            {
                await context.PortalContents
                    .Where(item => item.Id == current.Id)
                    .ExecuteUpdateAsync(
                        setters => setters
                            .SetProperty(item => item.Title, draft.Title)
                            .SetProperty(item => item.Summary, draft.Summary)
                            .SetProperty(item => item.Body, draft.Body)
                            .SetProperty(item => item.Location, draft.Location)
                            .SetProperty(item => item.Category, draft.Category)
                            .SetProperty(item => item.SortOrder, draft.Order)
                            .SetProperty(item => item.IsPublished, true),
                        cancellationToken)
                    .ConfigureAwait(false);
                continue;
            }

            context.PortalContents.Add(
                PortalContent.Create(
                    PortalContentKind.ServiceGuide,
                    draft.Title,
                    draft.Summary,
                    draft.Body,
                    draft.Slug,
                    location: draft.Location,
                    category: draft.Category,
                    sortOrder: draft.Order));
        }

        var leftoverIds = existing.Where(item => !keep.Contains(item.Slug)).Select(item => item.Id).ToList();
        if (leftoverIds.Count > 0)
        {
            await context.PortalContents
                .Where(item => leftoverIds.Contains(item.Id))
                .ExecuteUpdateAsync(
                    setters => setters.SetProperty(item => item.IsPublished, false),
                    cancellationToken)
                .ConfigureAwait(false);
        }

        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
