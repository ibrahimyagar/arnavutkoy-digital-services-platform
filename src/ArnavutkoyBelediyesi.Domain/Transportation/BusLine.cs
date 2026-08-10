using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Transportation;

/// <summary>
/// Belediye otobüs hattı (demo güzergah özeti ile).
/// </summary>
public sealed class BusLine : AuditableEntity
{
    private BusLine()
    {
        Code = string.Empty;
        Name = string.Empty;
        RouteSummary = string.Empty;
    }

    private BusLine(string code, string name, string routeSummary, decimal baseFare) : this()
    {
        Code = code;
        Name = name;
        RouteSummary = routeSummary;
        BaseFare = baseFare;
        IsActive = true;
    }

    public string Code { get; private set; }

    public string Name { get; private set; }

    public string RouteSummary { get; private set; }

    public decimal BaseFare { get; private set; }

    public bool IsActive { get; private set; }

    public static BusLine Create(string code, string name, string routeSummary, decimal baseFare)
    {
        if (string.IsNullOrWhiteSpace(code))
        {
            throw new ArgumentException("Hat kodu boş olamaz.", nameof(code));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Hat adı boş olamaz.", nameof(name));
        }

        if (baseFare <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(baseFare), baseFare, "Taban ücret sıfırdan büyük olmalıdır.");
        }

        return new BusLine(
            code.Trim().ToUpperInvariant(),
            name.Trim(),
            (routeSummary ?? string.Empty).Trim(),
            baseFare);
    }

    public void UpdateFare(decimal baseFare)
    {
        if (baseFare <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(baseFare));
        }

        BaseFare = baseFare;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}
