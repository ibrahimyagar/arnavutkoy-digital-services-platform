namespace ArnavutkoyBelediyesi.Application.Common.Options;

/// <summary>
/// Borç ödemeleriyle ilgili, belediye tarafından yapılandırılabilir iş kuralı ayarları.
/// </summary>
public sealed class PaymentOptions
{
    /// <summary>
    /// Yapılandırma dosyasındaki bölüm adı.
    /// </summary>
    public const string SectionName = "Payments";

    /// <summary>
    /// Vadesi geçen borçlara uygulanan günlük gecikme faizi oranı (%). Varsayılan: %0.1.
    /// </summary>
    public decimal DailyOverdueInterestRatePercent { get; set; } = 0.1m;
}
