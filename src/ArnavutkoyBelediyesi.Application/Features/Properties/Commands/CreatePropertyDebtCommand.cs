using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Commands;

/// <summary>
/// Aktif mülk için vatandaşa <see cref="DebtType.Property"/> borcu oluşturur (personel).
/// </summary>
public sealed record CreatePropertyDebtCommand(
    Guid PropertyId,
    decimal PrincipalAmount,
    DateTime DueDateUtc) : IRequest<Result<Guid>>;

public sealed class CreatePropertyDebtCommandValidator : AbstractValidator<CreatePropertyDebtCommand>
{
    public CreatePropertyDebtCommandValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.PrincipalAmount).GreaterThan(0);
        RuleFor(x => x.DueDateUtc).NotEmpty();
    }
}

public sealed class CreatePropertyDebtCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreatePropertyDebtCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreatePropertyDebtCommand request, CancellationToken cancellationToken)
    {
        var property = await unitOfWork.Repository<CitizenProperty>()
            .GetByIdAsync(request.PropertyId, cancellationToken)
            .ConfigureAwait(false);

        if (property is null)
        {
            return Result<Guid>.Failure($"'{request.PropertyId}' kimlikli mülk bulunamadı.");
        }

        if (!property.CanGenerateDebt)
        {
            return Result<Guid>.Failure("Yalnızca aktif mülkler için emlak vergisi borcu oluşturulabilir.");
        }

        var debt = Debt.Create(
            property.OwnerUserId,
            DebtType.Property,
            request.PrincipalAmount,
            request.DueDateUtc);

        await unitOfWork.Repository<Debt>().AddAsync(debt, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(debt.Id);
    }
}
