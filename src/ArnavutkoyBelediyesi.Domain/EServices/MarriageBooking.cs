using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public enum MarriageBookingStatus
{
    Reserved = 1,
    Cancelled = 2,
    Completed = 3,
}

public sealed class MarriageBooking : AuditableEntity
{
    private MarriageBooking()
    {
        PartnerFullName = string.Empty;
        TrackingCode = string.Empty;
    }

    public Guid SlotId { get; private set; }
    public Guid CitizenUserId { get; private set; }
    public string PartnerFullName { get; private set; }
    public string TrackingCode { get; private set; }
    public MarriageBookingStatus Status { get; private set; }

    public static MarriageBooking Create(Guid slotId, Guid citizenUserId, string partnerFullName, string trackingCode)
    {
        if (slotId == Guid.Empty || citizenUserId == Guid.Empty)
        {
            throw new ArgumentException("Slot ve vatandaş kimliği zorunludur.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(partnerFullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(trackingCode);

        return new MarriageBooking
        {
            SlotId = slotId,
            CitizenUserId = citizenUserId,
            PartnerFullName = partnerFullName.Trim(),
            TrackingCode = trackingCode.Trim().ToUpperInvariant(),
            Status = MarriageBookingStatus.Reserved,
        };
    }

    public void Cancel()
    {
        if (Status != MarriageBookingStatus.Reserved)
        {
            throw new InvalidOperationException("Yalnızca rezerve nikah kaydı iptal edilebilir.");
        }

        Status = MarriageBookingStatus.Cancelled;
    }
}
