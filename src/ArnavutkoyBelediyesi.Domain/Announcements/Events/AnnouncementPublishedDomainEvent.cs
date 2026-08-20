using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Announcements.Events;

/// <summary>
/// Bir duyuru yayınlandığında yükseltilen domain olayı (yayın bildirimi için).
/// </summary>
public sealed class AnnouncementPublishedDomainEvent(Guid announcementId, string title) : IDomainEvent
{
    public Guid AnnouncementId { get; } = announcementId;

    public string Title { get; } = title;

    /// <inheritdoc />
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
