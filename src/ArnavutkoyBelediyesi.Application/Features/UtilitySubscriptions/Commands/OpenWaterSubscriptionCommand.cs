using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Properties;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Commands;

/// <summary>
/// Vatandaş adına yeni su aboneliği açar. Abone numarası sistemde benzersiz olmalıdır.
/// </summary>
public sealed record OpenWaterSubscriptionCommand(
    Guid SubscriberUserId,
    Guid NeighborhoodId,
    Guid? PropertyId,
    string SubscriptionNumber) : IRequest<Result<Guid>>;

public sealed class OpenWaterSubscriptionCommandValidator : AbstractValidator<OpenWaterSubscriptionCommand>
{
    public OpenWaterSubscriptionCommandValidator()
    {
        RuleFor(x => x.SubscriberUserId).NotEmpty();
        RuleFor(x => x.NeighborhoodId).NotEmpty();
        RuleFor(x => x.SubscriptionNumber).NotEmpty().MaximumLength(50);
    }
}

public sealed class OpenWaterSubscriptionCommandHandler(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider)
    : IRequestHandler<OpenWaterSubscriptionCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(OpenWaterSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var neighborhood = await unitOfWork.Repository<Neighborhood>()
            .GetByIdAsync(request.NeighborhoodId, cancellationToken)
            .ConfigureAwait(false);

        if (neighborhood is null)
        {
            return Result<Guid>.Failure($"'{request.NeighborhoodId}' kimlikli mahalle bulunamadı.");
        }

        if (request.PropertyId.HasValue)
        {
            var property = await unitOfWork.Repository<CitizenProperty>()
                .GetByIdAsync(request.PropertyId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (property is null)
            {
                return Result<Guid>.Failure($"'{request.PropertyId}' kimlikli mülk bulunamadı.");
            }

            if (property.OwnerUserId != request.SubscriberUserId)
            {
                return Result<Guid>.Failure("Mülk, abone vatandaşa ait değil.");
            }

            if (property.NeighborhoodId != request.NeighborhoodId)
            {
                return Result<Guid>.Failure("Mülk mahallesi ile abonelik mahallesi uyuşmuyor.");
            }
        }

        var normalizedNumber = request.SubscriptionNumber.Trim().ToUpperInvariant();
        var duplicate = await unitOfWork.Repository<WaterSubscription>().Query()
            .AnyAsync(s => s.SubscriptionNumber == normalizedNumber, cancellationToken)
            .ConfigureAwait(false);

        if (duplicate)
        {
            return Result<Guid>.Failure($"'{normalizedNumber}' abone numarası zaten kayıtlı.");
        }

        var subscription = WaterSubscription.Open(
            request.SubscriberUserId,
            request.NeighborhoodId,
            request.PropertyId,
            request.SubscriptionNumber,
            dateTimeProvider.UtcNow);

        await unitOfWork.Repository<WaterSubscription>().AddAsync(subscription, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(subscription.Id);
    }
}
