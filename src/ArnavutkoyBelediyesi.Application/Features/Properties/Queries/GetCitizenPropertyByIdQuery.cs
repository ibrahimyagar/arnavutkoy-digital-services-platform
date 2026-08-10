using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Properties.Dtos;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Queries;

/// <summary>
/// Kimliğe göre tek bir mülk kaydını getirir.
/// </summary>
public sealed record GetCitizenPropertyByIdQuery(Guid PropertyId) : IRequest<Result<CitizenPropertyDto>>;

public sealed class GetCitizenPropertyByIdQueryValidator : AbstractValidator<GetCitizenPropertyByIdQuery>
{
    public GetCitizenPropertyByIdQueryValidator()
    {
        RuleFor(x => x.PropertyId).NotEmpty();
    }
}

public sealed class GetCitizenPropertyByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetCitizenPropertyByIdQuery, Result<CitizenPropertyDto>>
{
    public async Task<Result<CitizenPropertyDto>> Handle(
        GetCitizenPropertyByIdQuery request,
        CancellationToken cancellationToken)
    {
        var property = await unitOfWork.Repository<CitizenProperty>()
            .GetByIdAsync(request.PropertyId, cancellationToken)
            .ConfigureAwait(false);

        if (property is null)
        {
            return Result<CitizenPropertyDto>.Failure($"'{request.PropertyId}' kimlikli mülk bulunamadı.");
        }

        var dto = new CitizenPropertyDto(
            property.Id,
            property.OwnerUserId,
            property.NeighborhoodId,
            property.StreetId,
            property.Type,
            property.Title,
            property.DoorNumber,
            property.BlockParcel,
            property.IsActive);

        return Result<CitizenPropertyDto>.Success(dto);
    }
}
