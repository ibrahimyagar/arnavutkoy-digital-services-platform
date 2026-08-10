using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

/// <summary>
/// Demo imar parseli — gerçek tapu/imar verisi değildir.
/// </summary>
public sealed class ZoningParcel : AuditableEntity
{
    private ZoningParcel()
    {
        Ada = string.Empty;
        Parsel = string.Empty;
        NeighborhoodName = string.Empty;
        ZoningStatus = string.Empty;
        LandUse = string.Empty;
    }

    public string Ada { get; private set; }
    public string Parsel { get; private set; }
    public string NeighborhoodName { get; private set; }
    public string ZoningStatus { get; private set; }
    public string LandUse { get; private set; }
    public decimal AreaSqm { get; private set; }
    public decimal FeePerSqm { get; private set; }

    public static ZoningParcel Create(
        string ada,
        string parsel,
        string neighborhoodName,
        string zoningStatus,
        string landUse,
        decimal areaSqm,
        decimal feePerSqm)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(ada);
        ArgumentException.ThrowIfNullOrWhiteSpace(parsel);
        ArgumentException.ThrowIfNullOrWhiteSpace(neighborhoodName);
        if (areaSqm <= 0 || feePerSqm < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(areaSqm));
        }

        return new ZoningParcel
        {
            Ada = ada.Trim(),
            Parsel = parsel.Trim(),
            NeighborhoodName = neighborhoodName.Trim(),
            ZoningStatus = zoningStatus.Trim(),
            LandUse = landUse.Trim(),
            AreaSqm = areaSqm,
            FeePerSqm = feePerSqm,
        };
    }

    public decimal CalculateFee(decimal requestedAreaSqm)
    {
        if (requestedAreaSqm <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(requestedAreaSqm));
        }

        var area = Math.Min(requestedAreaSqm, AreaSqm);
        return Math.Round(area * FeePerSqm, 2, MidpointRounding.AwayFromZero);
    }
}
