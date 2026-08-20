using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Domain.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.EventHandlers;

public sealed class CitizenRequestResolvedNotificationHandler(
    IUnitOfWork unitOfWork,
    IEnumerable<INotificationSender> senders,
    IDateTimeProvider dateTimeProvider,
    ILogger<CitizenRequestResolvedNotificationHandler> logger)
    : INotificationHandler<DomainEventNotification<CitizenRequestResolvedDomainEvent>>
{
    public async Task Handle(
        DomainEventNotification<CitizenRequestResolvedDomainEvent> notification,
        CancellationToken cancellationToken)
    {
        var domainEvent = notification.DomainEvent;
        var statusLabel = domainEvent.Status == RequestStatus.Closed ? "kapatıldı" : "çözüldü";
        var subject = "Talebiniz güncellendi";
        var body = $"Talebiniz {statusLabel}. Talep no: {domainEvent.RequestId:N}";

        await NotificationDispatch.CreateAndSendAsync(
                unitOfWork,
                senders,
                dateTimeProvider,
                logger,
                domainEvent.CitizenUserId,
                NotificationChannel.InApp,
                subject,
                body,
                cancellationToken)
            .ConfigureAwait(false);
    }
}
