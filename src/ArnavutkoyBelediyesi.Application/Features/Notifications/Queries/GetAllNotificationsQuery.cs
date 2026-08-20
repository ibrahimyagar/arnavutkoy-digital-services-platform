using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Notifications.Dtos;
using ArnavutkoyBelediyesi.Domain.Notifications;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.Queries;

public sealed record GetAllNotificationsQuery(
    NotificationChannel? Channel = null,
    NotificationStatus? Status = null,
    Guid? RecipientUserId = null,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<NotificationLogDto>>>;

public sealed class GetAllNotificationsQueryValidator : AbstractValidator<GetAllNotificationsQuery>
{
    public GetAllNotificationsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAllNotificationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAllNotificationsQuery, Result<PaginatedList<NotificationLogDto>>>
{
    public async Task<Result<PaginatedList<NotificationLogDto>>> Handle(
        GetAllNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<NotificationLog>().Query();

        if (request.Channel.HasValue)
        {
            query = query.Where(n => n.Channel == request.Channel.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(n => n.Status == request.Status.Value);
        }

        if (request.RecipientUserId.HasValue)
        {
            query = query.Where(n => n.RecipientUserId == request.RecipientUserId.Value);
        }

        var projected = query
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
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<NotificationLogDto>>.Success(page);
    }
}
