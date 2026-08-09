using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;

/// <summary>
/// Bir vatandaş yeni bir talep oluşturduğunda yükseltilen domain olayı.
/// Örn. Infrastructure katmanında görevlilere bildirim gönderilmesi için kullanılabilir.
/// </summary>
public sealed class CitizenRequestCreatedDomainEvent(Guid requestId, Guid citizenUserId) : IDomainEvent
{
    /// <summary>
    /// Oluşturulan talebin kimliği.
    /// </summary>
    public Guid RequestId { get; } = requestId;

    /// <summary>
    /// Talebi oluşturan vatandaşın kullanıcı kimliği.
    /// </summary>
    public Guid CitizenUserId { get; } = citizenUserId;

    /// <inheritdoc />
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
