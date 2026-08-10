using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Transportation;

/// <summary>
/// Kart ile hatta biniş simülasyonu kaydı.
/// </summary>
public sealed class BoardingRecord : AuditableEntity
{
    private BoardingRecord()
    {
    }

    private BoardingRecord(Guid transportCardId, Guid busLineId, decimal fareCharged, DateTime boardedAtUtc) : this()
    {
        TransportCardId = transportCardId;
        BusLineId = busLineId;
        FareCharged = fareCharged;
        BoardedAtUtc = boardedAtUtc;
    }

    public Guid TransportCardId { get; private set; }

    public Guid BusLineId { get; private set; }

    public decimal FareCharged { get; private set; }

    public DateTime BoardedAtUtc { get; private set; }

    public static BoardingRecord Create(Guid transportCardId, Guid busLineId, decimal fareCharged, DateTime boardedAtUtc)
    {
        if (transportCardId == Guid.Empty || busLineId == Guid.Empty)
        {
            throw new ArgumentException("Kart ve hat kimlikleri zorunludur.");
        }

        if (fareCharged <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(fareCharged));
        }

        return new BoardingRecord(transportCardId, busLineId, fareCharged, boardedAtUtc);
    }
}
