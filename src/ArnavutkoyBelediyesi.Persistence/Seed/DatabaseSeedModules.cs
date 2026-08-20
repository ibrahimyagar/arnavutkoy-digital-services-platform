namespace ArnavutkoyBelediyesi.Persistence.Seed;

/// <summary>
/// Demo seed adımlarını seçmeli çalıştırmak için bayraklar.
/// Üretim varsayılanı <see cref="All"/>; entegrasyon testleri yalnızca ihtiyaç duyduğu alt kümeyi seçebilir.
/// </summary>
[Flags]
public enum DatabaseSeedModules
{
    None = 0,
    Identity = 1 << 0,
    Geography = 1 << 1,
    RequestCategories = 1 << 2,
    Announcements = 1 << 3,
    Hr = 1 << 4,
    Transportation = 1 << 5,
    CitizenDemoAssets = 1 << 6,
    Debts = 1 << 7,
    PortalAndEServices = 1 << 8,

    /// <summary>Auth / RBAC testleri için roller + demo kullanıcılar.</summary>
    IdentityOnly = Identity,

    /// <summary>Üretim ve tam API entegrasyon suite'i.</summary>
    All = Identity
        | Geography
        | RequestCategories
        | Announcements
        | Hr
        | Transportation
        | CitizenDemoAssets
        | Debts
        | PortalAndEServices,
}
