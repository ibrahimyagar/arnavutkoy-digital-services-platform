using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Notifications;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.Commands;

public sealed record SendTestNotificationCommand(
    Guid RecipientUserId,
    NotificationChannel Channel,
    string Subject,
    string Body) : IRequest<Result<Guid>>;

public sealed class SendTestNotificationCommandValidator : AbstractValidator<SendTestNotificationCommand>
{
    public SendTestNotificationCommandValidator()
    {
        RuleFor(x => x.RecipientUserId).NotEmpty();
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Channel).IsInEnum();
    }
}

public sealed class SendTestNotificationCommandHandler(
    IUnitOfWork unitOfWork,
    IEnumerable<INotificationSender> senders,
    IDateTimeProvider dateTimeProvider,
    ILogger<SendTestNotificationCommandHandler> logger)
    : IRequestHandler<SendTestNotificationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SendTestNotificationCommand request, CancellationToken cancellationToken)
    {
        var log = NotificationLog.Create(request.RecipientUserId, request.Channel, request.Subject, request.Body);
        await unitOfWork.Repository<NotificationLog>().AddAsync(log, cancellationToken).ConfigureAwait(false);

        var sender = senders.FirstOrDefault(s => s.Channel == request.Channel);
        if (sender is null)
        {
            log.MarkFailed($"Kanal için gönderici kayıtlı değil: {request.Channel}");
            await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return Result<Guid>.Success(log.Id);
        }

        try
        {
            await sender
                .SendAsync(request.RecipientUserId, request.Subject, request.Body, cancellationToken)
                .ConfigureAwait(false);
            log.MarkSent(dateTimeProvider.UtcNow);
        }
        catch (Exception exception)
        {
            log.MarkFailed(exception.Message);
            logger.LogWarning(exception, "Test bildirimi gönderilemedi. LogId={LogId}", log.Id);
        }

        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(log.Id);
    }
}
