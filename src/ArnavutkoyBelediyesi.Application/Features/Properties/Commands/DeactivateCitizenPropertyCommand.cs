using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Commands;

/// <summary>
/// Mülk kaydını pasife alır.
/// </summary>
public sealed record DeactivateCitizenPropertyCommand(Guid PropertyId) : IRequest<Result>;

public sealed class DeactivateCitizenPropertyCommandValidator : AbstractValidator<DeactivateCitizenPropertyCommand>
{
    public DeactivateCitizenPropertyCommandValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
    }
}

public sealed class DeactivateCitizenPropertyCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<DeactivateCitizenPropertyCommand, Result>
{
    public async Task<Result> Handle(DeactivateCitizenPropertyCommand request, CancellationToken cancellationToken)
    {
        var property = await unitOfWork.Repository<CitizenProperty>()
            .GetByIdAsync(request.PropertyId, cancellationToken)
            .ConfigureAwait(false);

        if (property is null)
        {
            return Result.Failure($"'{request.PropertyId}' kimlikli mülk bulunamadı.");
        }

        property.Deactivate();
        unitOfWork.Repository<CitizenProperty>().Update(property);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
