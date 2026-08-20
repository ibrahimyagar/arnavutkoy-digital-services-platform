using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Notifications;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

/// <summary>
/// Gerçek SMS/e-posta sağlayıcısı yerine Serilog ile bildirim denemesini kaydeder.
/// </summary>
public sealed class LoggingNotificationSender(
    ILogger<LoggingNotificationSender> logger,
    NotificationChannel channel) : INotificationSender
{
    public NotificationChannel Channel { get; } = channel;

    public Task SendAsync(
        Guid recipientUserId,
        string subject,
        string body,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "Bildirim gönderildi (simülasyon). Channel={Channel}, Recipient={RecipientUserId}, Subject={Subject}",
            Channel,
            recipientUserId,
            subject);

        return Task.CompletedTask;
    }
}
