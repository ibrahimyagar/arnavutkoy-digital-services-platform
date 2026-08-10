using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Properties.Dtos;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Queries;

/// <summary>
/// Personel için tüm mülkleri (isteğe bağlı sahip filtresiyle) sayfalı listeler.
/// </summary>
public sealed record GetAllCitizenPropertiesQuery(
    Guid? OwnerUserId,
    Guid? NeighborhoodId,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<CitizenPropertyDto>>>;

public sealed class GetAllCitizenPropertiesQueryValidator : AbstractValidator<GetAllCitizenPropertiesQuery>
{
    public GetAllCitizenPropertiesQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAllCitizenPropertiesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAllCitizenPropertiesQuery, Result<PaginatedList<CitizenPropertyDto>>>
{
    public async Task<Result<PaginatedList<CitizenPropertyDto>>> Handle(
        GetAllCitizenPropertiesQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<CitizenProperty>().Query();

        if (request.OwnerUserId.HasValue)
        {
            query = query.Where(p => p.OwnerUserId == request.OwnerUserId.Value);
        }

        if (request.NeighborhoodId.HasValue)
        {
            query = query.Where(p => p.NeighborhoodId == request.NeighborhoodId.Value);
        }

        var page = await PaginatedList<CitizenPropertyDto>
            .CreateAsync(
                query
                    .OrderByDescending(p => p.CreatedAtUtc)
                    .Select(p => new CitizenPropertyDto(
                        p.Id,
                        p.OwnerUserId,
                        p.NeighborhoodId,
                        p.StreetId,
                        p.Type,
                        p.Title,
                        p.DoorNumber,
                        p.BlockParcel,
                        p.IsActive)),
                request.PageNumber,
                request.PageSize,
                cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<CitizenPropertyDto>>.Success(page);
    }
}
