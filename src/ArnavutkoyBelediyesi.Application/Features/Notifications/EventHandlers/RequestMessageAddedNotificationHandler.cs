using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Domain.Notifications;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.EventHandlers;

public sealed class RequestMessageAddedNotificationHandler(
    IUnitOfWork unitOfWork,
    IEnumerable<INotificationSender> senders,
    IDateTimeProvider dateTimeProvider,
    ILogger<RequestMessageAddedNotificationHandler> logger)
    : INotificationHandler<DomainEventNotification<RequestMessageAddedDomainEvent>>
{
    public async Task Handle(
        DomainEventNotification<RequestMessageAddedDomainEvent> notification,
        CancellationToken cancellationToken)
    {
        var domainEvent = notification.DomainEvent;
        if (domainEvent.SenderType == SenderType.Citizen)
        {
            return;
        }

        var subject = "Talebinize yeni yanıt";
        var body = $"Talebinize personel yanıtı eklendi. Özet: {domainEvent.MessagePreview}";

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
