using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Dtos;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Queries;

public sealed record GetMyWaterSubscriptionsQuery(Guid SubscriberUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<WaterSubscriptionDto>>>;

public sealed class GetMyWaterSubscriptionsQueryValidator : AbstractValidator<GetMyWaterSubscriptionsQuery>
{
    public GetMyWaterSubscriptionsQueryValidator()
    {
        RuleFor(x => x.SubscriberUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMyWaterSubscriptionsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyWaterSubscriptionsQuery, Result<PaginatedList<WaterSubscriptionDto>>>
{
    public async Task<Result<PaginatedList<WaterSubscriptionDto>>> Handle(
        GetMyWaterSubscriptionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<WaterSubscription>().Query()
            .Where(s => s.SubscriberUserId == request.SubscriberUserId)
            .OrderByDescending(s => s.ActivatedAtUtc)
            .Select(s => new WaterSubscriptionDto(
                s.Id,
                s.SubscriberUserId,
                s.NeighborhoodId,
                s.PropertyId,
                s.SubscriptionNumber,
                s.Status,
                s.ActivatedAtUtc,
                s.ClosedAtUtc));

        var page = await PaginatedList<WaterSubscriptionDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<WaterSubscriptionDto>>.Success(page);
    }
}

public sealed record GetAllWaterSubscriptionsQuery(
    Guid? SubscriberUserId,
    WaterSubscriptionStatus? Status,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<WaterSubscriptionDto>>>;

public sealed class GetAllWaterSubscriptionsQueryValidator : AbstractValidator<GetAllWaterSubscriptionsQuery>
{
    public GetAllWaterSubscriptionsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAllWaterSubscriptionsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAllWaterSubscriptionsQuery, Result<PaginatedList<WaterSubscriptionDto>>>
{
    public async Task<Result<PaginatedList<WaterSubscriptionDto>>> Handle(
        GetAllWaterSubscriptionsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<WaterSubscription>().Query();

        if (request.SubscriberUserId.HasValue)
        {
            query = query.Where(s => s.SubscriberUserId == request.SubscriberUserId.Value);
        }

        if (request.Status.HasValue)
        {
            query = query.Where(s => s.Status == request.Status.Value);
        }

        var projected = query
            .OrderByDescending(s => s.ActivatedAtUtc)
            .Select(s => new WaterSubscriptionDto(
                s.Id,
                s.SubscriberUserId,
                s.NeighborhoodId,
                s.PropertyId,
                s.SubscriptionNumber,
                s.Status,
                s.ActivatedAtUtc,
                s.ClosedAtUtc));

        var page = await PaginatedList<WaterSubscriptionDto>
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<WaterSubscriptionDto>>.Success(page);
    }
}

public sealed record GetWaterSubscriptionByIdQuery(Guid SubscriptionId) : IRequest<Result<WaterSubscriptionDto>>;

public sealed class GetWaterSubscriptionByIdQueryValidator : AbstractValidator<GetWaterSubscriptionByIdQuery>
{
    public GetWaterSubscriptionByIdQueryValidator() => RuleFor(x => x.SubscriptionId).NotEmpty();
}

public sealed class GetWaterSubscriptionByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetWaterSubscriptionByIdQuery, Result<WaterSubscriptionDto>>
{
    public async Task<Result<WaterSubscriptionDto>> Handle(
        GetWaterSubscriptionByIdQuery request,
        CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<WaterSubscription>()
            .GetByIdAsync(request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (subscription is null)
        {
            return Result<WaterSubscriptionDto>.Failure($"'{request.SubscriptionId}' kimlikli abonelik bulunamadı.");
        }

        return Result<WaterSubscriptionDto>.Success(new WaterSubscriptionDto(
            subscription.Id,
            subscription.SubscriberUserId,
            subscription.NeighborhoodId,
            subscription.PropertyId,
            subscription.SubscriptionNumber,
            subscription.Status,
            subscription.ActivatedAtUtc,
            subscription.ClosedAtUtc));
    }
}
