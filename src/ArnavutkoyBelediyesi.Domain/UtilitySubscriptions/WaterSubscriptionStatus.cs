namespace ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;

/// <summary>
/// Su aboneliğinin yaşam döngüsü durumu.
/// </summary>
public enum WaterSubscriptionStatus
{
    /// <summary>
    /// Aktif abonelik; borç üretilebilir.
    /// </summary>
    Active = 0,

    /// <summary>
    /// Geçici askıya alınmış.
    /// </summary>
    Suspended = 1,

    /// <summary>
    /// Kapatılmış; yeni borç üretilemez.
    /// </summary>
    Closed = 2
}
