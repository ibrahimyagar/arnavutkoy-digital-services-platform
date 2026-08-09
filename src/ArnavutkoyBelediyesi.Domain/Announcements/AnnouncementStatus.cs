namespace ArnavutkoyBelediyesi.Domain.Announcements;

/// <summary>
/// Bir duyurunun yaşam döngüsündeki durumunu ifade eder.
/// </summary>
public enum AnnouncementStatus
{
    /// <summary>
    /// Henüz yayınlanmamış, sadece yönetici/memur tarafından görülebilen taslak.
    /// </summary>
    Draft = 0,

    /// <summary>
    /// Vatandaşlara açık, yayınlanmış duyuru.
    /// </summary>
    Published = 1,

    /// <summary>
    /// Yayından kaldırılmış, artık listelenmeyen duyuru.
    /// </summary>
    Archived = 2
}
