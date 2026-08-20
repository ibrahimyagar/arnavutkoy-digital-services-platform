using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Announcements.Events;
using ArnavutkoyBelediyesi.Domain.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.EventHandlers;

public sealed class AnnouncementPublishedNotificationHandler(
    IUnitOfWork unitOfWork,
    IEnumerable<INotificationSender> senders,
    IDateTimeProvider dateTimeProvider,
    ILogger<AnnouncementPublishedNotificationHandler> logger)
    : INotificationHandler<DomainEventNotification<AnnouncementPublishedDomainEvent>>
{
    public async Task Handle(
        DomainEventNotification<AnnouncementPublishedDomainEvent> notification,
        CancellationToken cancellationToken)
    {
        var domainEvent = notification.DomainEvent;
        var subject = "Yeni belediye duyurusu";
        var body = $"Yeni duyuru yayınlandı: {domainEvent.Title}";

        await NotificationDispatch.CreateAndSendAsync(
                unitOfWork,
                senders,
                dateTimeProvider,
                logger,
                NotificationLog.BroadcastRecipientId,
                NotificationChannel.InApp,
                subject,
                body,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
