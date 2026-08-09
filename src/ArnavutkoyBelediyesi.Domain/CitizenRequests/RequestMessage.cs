using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests;

/// <summary>
/// Bir vatandaş talebine ait tekil bir mesajı (vatandaş veya görevli tarafından) temsil eder.
/// </summary>
public sealed class RequestMessage : Entity
{
    private RequestMessage()
    {
        Message = string.Empty;
    }

    internal RequestMessage(Guid citizenRequestId, Guid senderUserId, SenderType senderType, string message)
        : this()
    {
        CitizenRequestId = citizenRequestId;
        SenderUserId = senderUserId;
        SenderType = senderType;
        Message = message;
        SentAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// Bağlı olduğu talebin kimliği.
    /// </summary>
    public Guid CitizenRequestId { get; private set; }

    /// <summary>
    /// Mesajı gönderen kullanıcının kimliği.
    /// </summary>
    public Guid SenderUserId { get; private set; }

    /// <summary>
    /// Gönderenin tarafı (vatandaş/görevli).
    /// </summary>
    public SenderType SenderType { get; private set; }

    /// <summary>
    /// Mesaj içeriği.
    /// </summary>
    public string Message { get; private set; }

    /// <summary>
    /// Mesajın gönderildiği UTC zaman.
    /// </summary>
    public DateTime SentAtUtc { get; private set; }
}
