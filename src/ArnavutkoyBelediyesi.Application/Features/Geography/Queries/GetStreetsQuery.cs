using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;
using ArnavutkoyBelediyesi.Domain.Geography;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Queries;

/// <summary>
/// Belirtilen mahalleye bağlı sokakları (veya mahalle belirtilmemişse tüm sokakları) listeler.
/// Herkese açık (anonim) erişilebilir.
/// </summary>
public sealed record GetStreetsQuery(Guid? NeighborhoodId) : IRequest<Result<IReadOnlyCollection<StreetDto>>>;

public sealed class GetStreetsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetStreetsQuery, Result<IReadOnlyCollection<StreetDto>>>
{
    public async Task<Result<IReadOnlyCollection<StreetDto>>> Handle(
        GetStreetsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<Street>().Query();

        if (request.NeighborhoodId.HasValue)
        {
            query = query.Where(street => street.NeighborhoodId == request.NeighborhoodId.Value);
        }

        var streets = await query
            .OrderBy(street => street.Name)
            .Select(street => new StreetDto(street.Id, street.NeighborhoodId, street.Name))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<StreetDto>>.Success(streets);
    }
}
