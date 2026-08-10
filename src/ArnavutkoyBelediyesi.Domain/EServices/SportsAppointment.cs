using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public enum SportsAppointmentStatus
{
    Booked = 1,
    Cancelled = 2,
    Completed = 3,
}

public sealed class SportsAppointment : AuditableEntity
{
    private SportsAppointment()
    {
        TrackingCode = string.Empty;
    }

    public Guid FacilityId { get; private set; }
    public Guid CitizenUserId { get; private set; }
    public DateTime SlotStartUtc { get; private set; }
    public DateTime SlotEndUtc { get; private set; }
    public string TrackingCode { get; private set; }
    public SportsAppointmentStatus Status { get; private set; }

    public static SportsAppointment Book(
        Guid facilityId,
        Guid citizenUserId,
        DateTime slotStartUtc,
        DateTime slotEndUtc,
        string trackingCode)
    {
        if (facilityId == Guid.Empty || citizenUserId == Guid.Empty)
        {
            throw new ArgumentException("Tesis ve vatandaş kimliği zorunludur.");
        }

        if (slotEndUtc <= slotStartUtc)
        {
            throw new ArgumentException("Randevu bitişi başlangıçtan sonra olmalıdır.");
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(trackingCode);

        return new SportsAppointment
        {
            FacilityId = facilityId,
            CitizenUserId = citizenUserId,
            SlotStartUtc = slotStartUtc,
            SlotEndUtc = slotEndUtc,
            TrackingCode = trackingCode.Trim().ToUpperInvariant(),
            Status = SportsAppointmentStatus.Booked,
        };
    }

    public void Cancel()
    {
        if (Status != SportsAppointmentStatus.Booked)
        {
            throw new InvalidOperationException("Yalnızca rezerve randevu iptal edilebilir.");
        }

        Status = SportsAppointmentStatus.Cancelled;
    }
}
