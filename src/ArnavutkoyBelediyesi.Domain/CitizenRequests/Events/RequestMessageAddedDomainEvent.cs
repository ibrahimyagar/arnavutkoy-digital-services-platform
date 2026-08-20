using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;

/// <summary>
/// Talebe yeni mesaj eklendiğinde yükseltilen domain olayı.
/// Personel mesajında vatandaşa bildirim gönderilmesi için kullanılır.
/// </summary>
public sealed class RequestMessageAddedDomainEvent(
    Guid requestId,
    Guid citizenUserId,
    Guid senderUserId,
    SenderType senderType,
    string messagePreview) : IDomainEvent
{
    public Guid RequestId { get; } = requestId;

    public Guid CitizenUserId { get; } = citizenUserId;

    public Guid SenderUserId { get; } = senderUserId;

    public SenderType SenderType { get; } = senderType;

    /// <summary>
    /// Bildirim gövdesi için kısaltılmış mesaj özeti (hassas veri içermemelidir).
    /// </summary>
    public string MessagePreview { get; } = messagePreview;

    /// <inheritdoc />
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
