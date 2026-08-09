namespace ArnavutkoyBelediyesi.Domain.CitizenRequests;

/// <summary>
/// Bir vatandaş talebinin işlem sürecindeki durumunu ifade eder.
/// </summary>
public enum RequestStatus
{
    /// <summary>
    /// Talep oluşturulmuş, henüz bir görevliye atanmamış/incelenmeye başlanmamış.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// Talep bir görevli tarafından inceleniyor.
    /// </summary>
    UnderReview = 1,

    /// <summary>
    /// Talep çözüme kavuşturulmuş.
    /// </summary>
    Resolved = 2,

    /// <summary>
    /// Talep kapatılmış; artık yeni mesaj eklenemez.
    /// </summary>
    Closed = 3
}
