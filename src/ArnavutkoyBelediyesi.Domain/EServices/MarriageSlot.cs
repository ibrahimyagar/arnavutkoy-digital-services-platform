using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public sealed class MarriageSlot : AuditableEntity
{
    private MarriageSlot()
    {
        HallName = string.Empty;
    }

    public string HallName { get; private set; }
    public DateTime CeremonyAtUtc { get; private set; }
    public int Capacity { get; private set; }
    public int BookedCount { get; private set; }
    public bool IsOpen { get; private set; }

    public int Remaining => Math.Max(0, Capacity - BookedCount);

    public static MarriageSlot Create(string hallName, DateTime ceremonyAtUtc, int capacity)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(hallName);
        if (capacity < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(capacity));
        }

        return new MarriageSlot
        {
            HallName = hallName.Trim(),
            CeremonyAtUtc = ceremonyAtUtc,
            Capacity = capacity,
            BookedCount = 0,
            IsOpen = true,
        };
    }

    public void ReserveOne()
    {
        if (!IsOpen || Remaining <= 0)
        {
            throw new InvalidOperationException("Bu nikah saati dolu veya kapalı.");
        }

        BookedCount += 1;
        if (BookedCount >= Capacity)
        {
            IsOpen = false;
        }
    }
}
