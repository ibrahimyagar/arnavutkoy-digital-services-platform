using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Properties.Dtos;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Queries;

/// <summary>
/// Geçerli vatandaşa ait mülkleri sayfalı listeler.
/// </summary>
public sealed record GetMyCitizenPropertiesQuery(Guid OwnerUserId, int PageNumber = 1, int PageSize = 20, bool? ActiveOnly = true)
    : IRequest<Result<PaginatedList<CitizenPropertyDto>>>;

public sealed class GetMyCitizenPropertiesQueryValidator : AbstractValidator<GetMyCitizenPropertiesQuery>
{
    public GetMyCitizenPropertiesQueryValidator()
    {
        RuleFor(x => x.OwnerUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMyCitizenPropertiesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyCitizenPropertiesQuery, Result<PaginatedList<CitizenPropertyDto>>>
{
    public async Task<Result<PaginatedList<CitizenPropertyDto>>> Handle(
        GetMyCitizenPropertiesQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<CitizenProperty>().Query()
            .Where(p => p.OwnerUserId == request.OwnerUserId);

        if (request.ActiveOnly == true)
        {
            query = query.Where(p => p.IsActive);
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
