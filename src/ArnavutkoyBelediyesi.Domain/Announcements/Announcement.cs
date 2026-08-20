using ArnavutkoyBelediyesi.Domain.Announcements.Events;
using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Announcements;

/// <summary>
/// Belediye tarafından vatandaşlara yönelik yayınlanan bir duyuruyu temsil eder.
/// Zengin domain model ilkesine uygun olarak, durum geçişleri (yayınlama/arşivleme)
/// entity üzerindeki metotlar aracılığıyla, kurallara uygun şekilde yapılır.
/// </summary>
public sealed class Announcement : AuditableEntity
{
    private Announcement()
    {
        Title = string.Empty;
        Content = string.Empty;
    }

    private Announcement(string title, string content, DateTime? publishEndUtc) : this()
    {
        Title = title;
        Content = content;
        PublishEndUtc = publishEndUtc;
        Status = AnnouncementStatus.Draft;
    }

    /// <summary>
    /// Duyuru başlığı.
    /// </summary>
    public string Title { get; private set; }

    /// <summary>
    /// Duyuru içeriği.
    /// </summary>
    public string Content { get; private set; }

    /// <summary>
    /// Duyurunun yayına alındığı UTC zaman (taslak iken null).
    /// </summary>
    public DateTime? PublishStartUtc { get; private set; }

    /// <summary>
    /// Duyurunun geçerliliğini kaybedeceği UTC zaman (belirsiz süreli ise null).
    /// </summary>
    public DateTime? PublishEndUtc { get; private set; }

    /// <summary>
    /// Duyurunun mevcut durumu.
    /// </summary>
    public AnnouncementStatus Status { get; private set; }

    /// <summary>
    /// Yeni bir taslak duyuru oluşturur.
    /// </summary>
    /// <param name="title">Başlık, boş olamaz.</param>
    /// <param name="content">İçerik, boş olamaz.</param>
    /// <param name="publishEndUtc">Opsiyonel geçerlilik bitiş zamanı.</param>
    public static Announcement CreateDraft(string title, string content, DateTime? publishEndUtc)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Duyuru başlığı boş olamaz.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Duyuru içeriği boş olamaz.", nameof(content));
        }

        if (publishEndUtc.HasValue && publishEndUtc.Value <= DateTime.UtcNow)
        {
            throw new ArgumentException("Geçerlilik bitiş tarihi geçmişte olamaz.", nameof(publishEndUtc));
        }

        return new Announcement(title.Trim(), content.Trim(), publishEndUtc);
    }

    /// <summary>
    /// Taslak duyuruyu yayına alır.
    /// </summary>
    public void Publish(DateTime nowUtc)
    {
        if (Status == AnnouncementStatus.Archived)
        {
            throw new InvalidOperationException("Arşivlenmiş bir duyuru yeniden yayınlanamaz; yeni bir duyuru oluşturulmalıdır.");
        }

        Status = AnnouncementStatus.Published;
        PublishStartUtc = nowUtc;
        RaiseDomainEvent(new AnnouncementPublishedDomainEvent(Id, Title));
    }

    /// <summary>
    /// Yayındaki duyuruyu arşivler; artık vatandaşlara gösterilmez.
    /// </summary>
    public void Archive()
    {
        Status = AnnouncementStatus.Archived;
    }

    /// <summary>
    /// Duyuru içeriğini günceller. Yalnızca taslak durumundaki duyurular düzenlenebilir;
    /// yayınlanmış bir duyuruda değişiklik gerekiyorsa arşivlenip yeni duyuru açılması istenir.
    /// </summary>
    public void UpdateContent(string title, string content)
    {
        if (Status != AnnouncementStatus.Draft)
        {
            throw new InvalidOperationException("Yalnızca taslak durumundaki duyurular düzenlenebilir.");
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Duyuru başlığı boş olamaz.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ArgumentException("Duyuru içeriği boş olamaz.", nameof(content));
        }

        Title = title.Trim();
        Content = content.Trim();
    }

    /// <summary>
    /// Belirtilen zaman itibarıyla duyurunun vatandaşlara görünür olup olmadığını hesaplar.
    /// </summary>
    public bool IsVisible(DateTime asOfUtc)
    {
        if (Status != AnnouncementStatus.Published)
        {
            return false;
        }

        return !PublishEndUtc.HasValue || PublishEndUtc.Value >= asOfUtc;
    }
}
