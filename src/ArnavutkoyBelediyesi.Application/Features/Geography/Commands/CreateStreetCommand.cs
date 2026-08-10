using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Commands;

/// <summary>
/// Belirtilen mahalleye bağlı yeni bir sokak oluşturur. Yalnızca Administrator rolü tarafından
/// çağrılabilir (API katmanında yetkilendirilir).
/// </summary>
public sealed record CreateStreetCommand(Guid NeighborhoodId, string Name) : IRequest<Result<Guid>>;

public sealed class CreateStreetCommandValidator : AbstractValidator<CreateStreetCommand>
{
    public CreateStreetCommandValidator()
    {
        RuleFor(x => x.NeighborhoodId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
    }
}

public sealed class CreateStreetCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateStreetCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateStreetCommand request, CancellationToken cancellationToken)
    {
        var neighborhood = await unitOfWork.Repository<Neighborhood>()
            .GetByIdAsync(request.NeighborhoodId, cancellationToken)
            .ConfigureAwait(false);

        if (neighborhood is null)
        {
            return Result<Guid>.Failure($"'{request.NeighborhoodId}' kimlikli mahalle bulunamadı.");
        }

        var street = Street.Create(request.NeighborhoodId, request.Name);

        await unitOfWork.Repository<Street>().AddAsync(street, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(street.Id);
    }
}
