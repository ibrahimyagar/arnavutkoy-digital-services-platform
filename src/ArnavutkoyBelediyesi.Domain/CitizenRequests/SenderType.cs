namespace ArnavutkoyBelediyesi.Domain.CitizenRequests;

/// <summary>
/// Bir talep mesajının gönderen tarafını ifade eder.
/// </summary>
public enum SenderType
{
    /// <summary>
    /// Mesajı talebin sahibi vatandaş göndermiştir.
    /// </summary>
    Citizen = 0,

    /// <summary>
    /// Mesajı belediye görevlisi göndermiştir.
    /// </summary>
    Officer = 1
}
