using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Notifications.Dtos;
using ArnavutkoyBelediyesi.Domain.Notifications;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.Queries;

public sealed record GetMyNotificationsQuery(Guid RecipientUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<NotificationLogDto>>>;

public sealed class GetMyNotificationsQueryValidator : AbstractValidator<GetMyNotificationsQuery>
{
    public GetMyNotificationsQueryValidator()
    {
        RuleFor(x => x.RecipientUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMyNotificationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyNotificationsQuery, Result<PaginatedList<NotificationLogDto>>>
{
    public async Task<Result<PaginatedList<NotificationLogDto>>> Handle(
        GetMyNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var broadcastId = NotificationLog.BroadcastRecipientId;
        var query = unitOfWork.Repository<NotificationLog>()
            .Query()
            .Where(n =>
                n.RecipientUserId == request.RecipientUserId
                || (n.Channel == NotificationChannel.InApp && n.RecipientUserId == broadcastId))
            .OrderByDescending(n => n.CreatedAtUtc)
            .Select(n => new NotificationLogDto(
                n.Id,
                n.RecipientUserId,
                n.Channel,
                n.Subject,
                n.Body,
                n.Status,
                n.CreatedAtUtc,
                n.SentAtUtc,
                n.ErrorMessage));

        var page = await PaginatedList<NotificationLogDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<NotificationLogDto>>.Success(page);
    }
}
