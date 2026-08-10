using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Commands;

/// <summary>
/// Vatandaş adına yeni bir mülk kaydı oluşturur. OwnerUserId JWT'den gelir.
/// </summary>
public sealed record RegisterCitizenPropertyCommand(
    Guid OwnerUserId,
    Guid NeighborhoodId,
    Guid? StreetId,
    PropertyType Type,
    string Title,
    string DoorNumber,
    string BlockParcel) : IRequest<Result<Guid>>;

public sealed class RegisterCitizenPropertyCommandValidator : AbstractValidator<RegisterCitizenPropertyCommand>
{
    public RegisterCitizenPropertyCommandValidator()
    {
        RuleFor(x => x.OwnerUserId).NotEmpty();
        RuleFor(x => x.NeighborhoodId).NotEmpty();
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.DoorNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BlockParcel).MaximumLength(100);
    }
}

public sealed class RegisterCitizenPropertyCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<RegisterCitizenPropertyCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(RegisterCitizenPropertyCommand request, CancellationToken cancellationToken)
    {
        var neighborhood = await unitOfWork.Repository<Neighborhood>()
            .GetByIdAsync(request.NeighborhoodId, cancellationToken)
            .ConfigureAwait(false);

        if (neighborhood is null)
        {
            return Result<Guid>.Failure($"'{request.NeighborhoodId}' kimlikli mahalle bulunamadı.");
        }

        if (request.StreetId.HasValue)
        {
            var street = await unitOfWork.Repository<Street>()
                .GetByIdAsync(request.StreetId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (street is null)
            {
                return Result<Guid>.Failure($"'{request.StreetId}' kimlikli sokak bulunamadı.");
            }

            if (street.NeighborhoodId != request.NeighborhoodId)
            {
                return Result<Guid>.Failure("Seçilen sokak, belirtilen mahalleye ait değil.");
            }
        }

        var property = CitizenProperty.Create(
            request.OwnerUserId,
            request.NeighborhoodId,
            request.StreetId,
            request.Type,
            request.Title,
            request.DoorNumber,
            request.BlockParcel);

        await unitOfWork.Repository<CitizenProperty>().AddAsync(property, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(property.Id);
    }
}
