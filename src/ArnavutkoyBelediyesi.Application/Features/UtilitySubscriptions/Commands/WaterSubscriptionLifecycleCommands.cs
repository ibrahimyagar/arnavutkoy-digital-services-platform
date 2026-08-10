using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Commands;

public sealed record SuspendWaterSubscriptionCommand(Guid SubscriptionId) : IRequest<Result>;

public sealed class SuspendWaterSubscriptionCommandValidator : AbstractValidator<SuspendWaterSubscriptionCommand>
{
    public SuspendWaterSubscriptionCommandValidator() => RuleFor(x => x.SubscriptionId).NotEmpty();
}

public sealed class SuspendWaterSubscriptionCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<SuspendWaterSubscriptionCommand, Result>
{
    public async Task<Result> Handle(SuspendWaterSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<WaterSubscription>()
            .GetByIdAsync(request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (subscription is null)
        {
            return Result.Failure($"'{request.SubscriptionId}' kimlikli abonelik bulunamadı.");
        }

        try
        {
            subscription.Suspend();
        }
        catch (Domain.Exceptions.InvalidWaterSubscriptionStateException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<WaterSubscription>().Update(subscription);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record ReactivateWaterSubscriptionCommand(Guid SubscriptionId) : IRequest<Result>;

public sealed class ReactivateWaterSubscriptionCommandValidator : AbstractValidator<ReactivateWaterSubscriptionCommand>
{
    public ReactivateWaterSubscriptionCommandValidator() => RuleFor(x => x.SubscriptionId).NotEmpty();
}

public sealed class ReactivateWaterSubscriptionCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ReactivateWaterSubscriptionCommand, Result>
{
    public async Task<Result> Handle(ReactivateWaterSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<WaterSubscription>()
            .GetByIdAsync(request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (subscription is null)
        {
            return Result.Failure($"'{request.SubscriptionId}' kimlikli abonelik bulunamadı.");
        }

        try
        {
            subscription.Reactivate();
        }
        catch (Domain.Exceptions.InvalidWaterSubscriptionStateException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<WaterSubscription>().Update(subscription);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record CloseWaterSubscriptionCommand(Guid SubscriptionId) : IRequest<Result>;

public sealed class CloseWaterSubscriptionCommandValidator : AbstractValidator<CloseWaterSubscriptionCommand>
{
    public CloseWaterSubscriptionCommandValidator() => RuleFor(x => x.SubscriptionId).NotEmpty();
}

public sealed class CloseWaterSubscriptionCommandHandler(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
    : IRequestHandler<CloseWaterSubscriptionCommand, Result>
{
    public async Task<Result> Handle(CloseWaterSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<WaterSubscription>()
            .GetByIdAsync(request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (subscription is null)
        {
            return Result.Failure($"'{request.SubscriptionId}' kimlikli abonelik bulunamadı.");
        }

        try
        {
            subscription.Close(dateTimeProvider.UtcNow);
        }
        catch (Domain.Exceptions.InvalidWaterSubscriptionStateException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<WaterSubscription>().Update(subscription);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
