namespace ArnavutkoyBelediyesi.Domain.Payments;

/// <summary>
/// Bir borcun kaynağını ifade eder.
/// </summary>
public enum DebtType
{
    /// <summary>
    /// Su tüketim borcu.
    /// </summary>
    Water = 0,

    /// <summary>
    /// Emlak (gayrimenkul) vergisi borcu.
    /// </summary>
    Property = 1,

    /// <summary>
    /// Diğer belediye alacakları.
    /// </summary>
    Other = 2
}
