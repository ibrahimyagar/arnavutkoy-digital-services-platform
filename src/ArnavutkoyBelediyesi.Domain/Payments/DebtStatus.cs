namespace ArnavutkoyBelediyesi.Domain.Payments;

/// <summary>
/// Bir borcun ödeme durumunu ifade eder.
/// </summary>
public enum DebtStatus
{
    /// <summary>
    /// Borç henüz ödenmemiş.
    /// </summary>
    Unpaid = 0,

    /// <summary>
    /// Borç ödenmiş.
    /// </summary>
    Paid = 1
}
