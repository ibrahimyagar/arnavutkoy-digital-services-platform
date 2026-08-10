using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Commands;

/// <summary>
/// Aktif su aboneliği için vatandaşa <see cref="DebtType.Water"/> borcu oluşturur (personel).
/// </summary>
public sealed record CreateWaterDebtForSubscriptionCommand(
    Guid SubscriptionId,
    decimal PrincipalAmount,
    DateTime DueDateUtc) : IRequest<Result<Guid>>;

public sealed class CreateWaterDebtForSubscriptionCommandValidator
    : AbstractValidator<CreateWaterDebtForSubscriptionCommand>
{
    public CreateWaterDebtForSubscriptionCommandValidator()
    {
        RuleFor(x => x.SubscriptionId).NotEmpty();
        RuleFor(x => x.PrincipalAmount).GreaterThan(0);
        RuleFor(x => x.DueDateUtc).NotEmpty();
    }
}

public sealed class CreateWaterDebtForSubscriptionCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateWaterDebtForSubscriptionCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        CreateWaterDebtForSubscriptionCommand request,
        CancellationToken cancellationToken)
    {
        var subscription = await unitOfWork.Repository<WaterSubscription>()
            .GetByIdAsync(request.SubscriptionId, cancellationToken)
            .ConfigureAwait(false);

        if (subscription is null)
        {
            return Result<Guid>.Failure($"'{request.SubscriptionId}' kimlikli abonelik bulunamadı.");
        }

        if (!subscription.CanGenerateDebt)
        {
            return Result<Guid>.Failure("Yalnızca aktif abonelikler için su borcu oluşturulabilir.");
        }

        var debt = Debt.Create(
            subscription.SubscriberUserId,
            DebtType.Water,
            request.PrincipalAmount,
            request.DueDateUtc);

        await unitOfWork.Repository<Debt>().AddAsync(debt, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(debt.Id);
    }
}
