namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// Sistemdeki sabit yetkilendirme rollerini tanımlar. Rol adları string sabiti olarak
/// tutulduğundan Domain katmanı, ASP.NET Core Identity paketine bağımlı olmadan bu değerleri
/// üst katmanlarla (rol tabanlı yetkilendirme, seed data) paylaşabilir.
/// </summary>
public static class Roles
{
    /// <summary>
    /// Belediye hizmetlerinden yararlanan vatandaş.
    /// </summary>
    public const string Citizen = "Citizen";

    /// <summary>
    /// Talepleri ve duyuruları yöneten belediye görevlisi.
    /// </summary>
    public const string Officer = "Officer";

    /// <summary>
    /// Referans veri (coğrafi bilgi, kategori vb.) ve kullanıcı yönetimi yapabilen yönetici.
    /// </summary>
    public const string Administrator = "Administrator";

    /// <summary>
    /// Tüm tanımlı rollerin listesi (seed işlemleri için).
    /// </summary>
    public static readonly IReadOnlyCollection<string> All = [Citizen, Officer, Administrator];
}
