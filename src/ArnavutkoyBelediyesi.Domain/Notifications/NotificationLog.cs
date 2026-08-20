using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Notifications;

/// <summary>
/// Sistem tarafından üretilen bir bildirim denemesinin kalıcı kaydı.
/// Hassas veri (şifre, tam kart numarası vb.) gövdeye yazılmaz.
/// </summary>
public sealed class NotificationLog : AuditableEntity
{
    /// <summary>
    /// Duyuru gibi yayın bildirimlerinde tüm vatandaşlara gösterilen ortak alıcı kimliği.
    /// </summary>
    public static readonly Guid BroadcastRecipientId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    private NotificationLog()
    {
        Subject = string.Empty;
        Body = string.Empty;
        ErrorMessage = string.Empty;
    }

    private NotificationLog(
        Guid recipientUserId,
        NotificationChannel channel,
        string subject,
        string body) : this()
    {
        RecipientUserId = recipientUserId;
        Channel = channel;
        Subject = subject;
        Body = body;
        Status = NotificationStatus.Pending;
    }

    public Guid RecipientUserId { get; private set; }

    public NotificationChannel Channel { get; private set; }

    public string Subject { get; private set; }

    public string Body { get; private set; }

    public NotificationStatus Status { get; private set; }

    public DateTime? SentAtUtc { get; private set; }

    public string ErrorMessage { get; private set; }

    public static NotificationLog Create(
        Guid recipientUserId,
        NotificationChannel channel,
        string subject,
        string body)
    {
        if (recipientUserId == Guid.Empty)
        {
            throw new ArgumentException("Alıcı kimliği boş olamaz.", nameof(recipientUserId));
        }

        if (string.IsNullOrWhiteSpace(subject))
        {
            throw new ArgumentException("Bildirim konusu boş olamaz.", nameof(subject));
        }

        if (string.IsNullOrWhiteSpace(body))
        {
            throw new ArgumentException("Bildirim gövdesi boş olamaz.", nameof(body));
        }

        return new NotificationLog(
            recipientUserId,
            channel,
            subject.Trim(),
            TruncateBody(body.Trim()));
    }

    public void MarkSent(DateTime sentAtUtc)
    {
        if (Status == NotificationStatus.Sent)
        {
            return;
        }

        Status = NotificationStatus.Sent;
        SentAtUtc = sentAtUtc;
        ErrorMessage = string.Empty;
    }

    public void MarkFailed(string errorMessage)
    {
        Status = NotificationStatus.Failed;
        SentAtUtc = null;
        ErrorMessage = string.IsNullOrWhiteSpace(errorMessage)
            ? "Gönderim başarısız."
            : errorMessage.Trim();
    }

    private static string TruncateBody(string body) =>
        body.Length <= 2000 ? body : body[..2000];
}
