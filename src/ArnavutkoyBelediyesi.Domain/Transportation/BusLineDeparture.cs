using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Transportation;

/// <summary>
/// Hat hareket saati (demo; haftanın günü + saat).
/// </summary>
public sealed class BusLineDeparture : AuditableEntity
{
    private BusLineDeparture()
    {
        Note = string.Empty;
    }

    private BusLineDeparture(Guid busLineId, DayOfWeek dayOfWeek, TimeOnly departureTime, string note) : this()
    {
        BusLineId = busLineId;
        DayOfWeek = dayOfWeek;
        DepartureTime = departureTime;
        Note = note;
    }

    public Guid BusLineId { get; private set; }

    public DayOfWeek DayOfWeek { get; private set; }

    public TimeOnly DepartureTime { get; private set; }

    public string Note { get; private set; }

    public static BusLineDeparture Create(Guid busLineId, DayOfWeek dayOfWeek, TimeOnly departureTime, string? note)
    {
        if (busLineId == Guid.Empty)
        {
            throw new ArgumentException("Hat kimliği boş olamaz.", nameof(busLineId));
        }

        if (!Enum.IsDefined(dayOfWeek))
        {
            throw new ArgumentOutOfRangeException(nameof(dayOfWeek));
        }

        return new BusLineDeparture(busLineId, dayOfWeek, departureTime, (note ?? string.Empty).Trim());
    }
}
