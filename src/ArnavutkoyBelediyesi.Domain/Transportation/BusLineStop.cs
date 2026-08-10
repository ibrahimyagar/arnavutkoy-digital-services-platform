using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Transportation;

/// <summary>
/// Bir otobüs hattındaki sıralı durak.
/// </summary>
public sealed class BusLineStop : AuditableEntity
{
    private BusLineStop()
    {
        Name = string.Empty;
    }

    private BusLineStop(Guid busLineId, int sequence, string name) : this()
    {
        BusLineId = busLineId;
        Sequence = sequence;
        Name = name;
    }

    public Guid BusLineId { get; private set; }

    /// <summary>
    /// Güzergâh sırası (1 tabanlı).
    /// </summary>
    public int Sequence { get; private set; }

    public string Name { get; private set; }

    public static BusLineStop Create(Guid busLineId, int sequence, string name)
    {
        if (busLineId == Guid.Empty)
        {
            throw new ArgumentException("Hat kimliği boş olamaz.", nameof(busLineId));
        }

        if (sequence < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(sequence), sequence, "Durak sırası en az 1 olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Durak adı boş olamaz.", nameof(name));
        }

        return new BusLineStop(busLineId, sequence, name.Trim());
    }

    public void Rename(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Durak adı boş olamaz.", nameof(name));
        }

        Name = name.Trim();
    }
}
