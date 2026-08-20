using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;

/// <summary>
/// Talep çözüldüğünde veya kapatıldığında yükseltilen domain olayı (vatandaş bildirimi için).
/// </summary>
public sealed class CitizenRequestResolvedDomainEvent(Guid requestId, Guid citizenUserId, RequestStatus status)
    : IDomainEvent
{
    public Guid RequestId { get; } = requestId;

    public Guid CitizenUserId { get; } = citizenUserId;

    public RequestStatus Status { get; } = status;

    /// <inheritdoc />
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
