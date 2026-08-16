using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Portal;

public enum EventRegistrationStatus
{
    Registered = 1,
    Cancelled = 2,
}

/// <summary>
/// Vatandaşın yayımlanmış bir etkinliğe katılım kaydı. Aynı kullanıcı-etkinlik çifti
/// tek satırdır; iptal sonrası yeniden kayıt aynı kaydı yeniden açar.
/// </summary>
public sealed class EventRegistration : AuditableEntity
{
    private EventRegistration()
    {
    }

    public Guid EventId { get; private set; }
    public Guid CitizenUserId { get; private set; }
    public EventRegistrationStatus Status { get; private set; }
    public DateTime RegisteredAtUtc { get; private set; }
    public DateTime? CancelledAtUtc { get; private set; }

    public static EventRegistration Create(Guid eventId, Guid citizenUserId, DateTime registeredAtUtc)
    {
        if (eventId == Guid.Empty || citizenUserId == Guid.Empty)
        {
            throw new ArgumentException("Etkinlik ve kullanıcı kimliği zorunludur.");
        }

        return new EventRegistration
        {
            EventId = eventId,
            CitizenUserId = citizenUserId,
            Status = EventRegistrationStatus.Registered,
            RegisteredAtUtc = registeredAtUtc,
        };
    }

    public void Cancel(DateTime cancelledAtUtc)
    {
        if (Status != EventRegistrationStatus.Registered)
        {
            throw new InvalidOperationException("Yalnızca aktif kayıt iptal edilebilir.");
        }

        Status = EventRegistrationStatus.Cancelled;
        CancelledAtUtc = cancelledAtUtc;
    }

    public void Reactivate(DateTime registeredAtUtc)
    {
        if (Status != EventRegistrationStatus.Cancelled)
        {
            throw new InvalidOperationException("Yalnızca iptal edilmiş kayıt yeniden açılabilir.");
        }

        Status = EventRegistrationStatus.Registered;
        RegisteredAtUtc = registeredAtUtc;
        CancelledAtUtc = null;
    }
}
