using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Commands;

/// <summary>
/// Mevcut bir mülkün adres bilgilerini günceller. Ownership API katmanında kontrol edilir.
/// </summary>
public sealed record UpdateCitizenPropertyAddressCommand(
    Guid PropertyId,
    Guid NeighborhoodId,
    Guid? StreetId,
    string DoorNumber,
    string BlockParcel) : IRequest<Result>;

public sealed class UpdateCitizenPropertyAddressCommandValidator : AbstractValidator<UpdateCitizenPropertyAddressCommand>
{
    public UpdateCitizenPropertyAddressCommandValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
        RuleFor(x => x.NeighborhoodId).NotEmpty();
        RuleFor(x => x.DoorNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.BlockParcel).MaximumLength(100);
    }
}

public sealed class UpdateCitizenPropertyAddressCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateCitizenPropertyAddressCommand, Result>
{
    public async Task<Result> Handle(UpdateCitizenPropertyAddressCommand request, CancellationToken cancellationToken)
    {
        var property = await unitOfWork.Repository<CitizenProperty>()
            .GetByIdAsync(request.PropertyId, cancellationToken)
            .ConfigureAwait(false);

        if (property is null)
        {
            return Result.Failure($"'{request.PropertyId}' kimlikli mülk bulunamadı.");
        }

        var neighborhood = await unitOfWork.Repository<Neighborhood>()
            .GetByIdAsync(request.NeighborhoodId, cancellationToken)
            .ConfigureAwait(false);

        if (neighborhood is null)
        {
            return Result.Failure($"'{request.NeighborhoodId}' kimlikli mahalle bulunamadı.");
        }

        if (request.StreetId.HasValue)
        {
            var street = await unitOfWork.Repository<Street>()
                .GetByIdAsync(request.StreetId.Value, cancellationToken)
                .ConfigureAwait(false);

            if (street is null)
            {
                return Result.Failure($"'{request.StreetId}' kimlikli sokak bulunamadı.");
            }

            if (street.NeighborhoodId != request.NeighborhoodId)
            {
                return Result.Failure("Seçilen sokak, belirtilen mahalleye ait değil.");
            }
        }

        property.UpdateAddress(request.NeighborhoodId, request.StreetId, request.DoorNumber, request.BlockParcel);
        unitOfWork.Repository<CitizenProperty>().Update(property);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
