using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Notifications;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications;

/// <summary>
/// Domain olaylarından NotificationLog üretimi ve kanal gönderimini ortaklaştırır.
/// </summary>
internal static class NotificationDispatch
{
    internal static async Task CreateAndSendAsync(
        IUnitOfWork unitOfWork,
        IEnumerable<INotificationSender> senders,
        IDateTimeProvider dateTimeProvider,
        ILogger logger,
        Guid recipientUserId,
        NotificationChannel channel,
        string subject,
        string body,
        CancellationToken cancellationToken)
    {
        var log = NotificationLog.Create(recipientUserId, channel, subject, body);
        await unitOfWork.Repository<NotificationLog>().AddAsync(log, cancellationToken).ConfigureAwait(false);

        var sender = senders.FirstOrDefault(s => s.Channel == channel);
        if (sender is null)
        {
            log.MarkFailed($"Kanal için gönderici kayıtlı değil: {channel}");
            await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            logger.LogWarning("Bildirim göndericisi bulunamadı. Channel={Channel}, LogId={LogId}", channel, log.Id);
            return;
        }

        try
        {
            await sender.SendAsync(recipientUserId, subject, body, cancellationToken).ConfigureAwait(false);
            log.MarkSent(dateTimeProvider.UtcNow);
        }
        catch (Exception exception)
        {
            log.MarkFailed(exception.Message);
            logger.LogWarning(exception, "Bildirim gönderilemedi. LogId={LogId}, Channel={Channel}", log.Id, channel);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
