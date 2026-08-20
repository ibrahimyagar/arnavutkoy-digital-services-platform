using ArnavutkoyBelediyesi.Domain.Notifications;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Bildirim kanalı üzerinden mesaj gönderimini soyutlar.
/// Somut sağlayıcılar (log, SMTP, SMS) Infrastructure katmanında kayıt edilir.
/// </summary>
public interface INotificationSender
{
    /// <summary>
    /// Desteklenen kanal.
    /// </summary>
    NotificationChannel Channel { get; }

    /// <summary>
    /// Bildirimi ilgili kanala iletmeyi dener. Başarısızlıkta exception fırlatabilir.
    /// </summary>
    Task SendAsync(
        Guid recipientUserId,
        string subject,
        string body,
        CancellationToken cancellationToken = default);
}
