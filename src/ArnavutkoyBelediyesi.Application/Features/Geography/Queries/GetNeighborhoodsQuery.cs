using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;
using ArnavutkoyBelediyesi.Domain.Geography;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Queries;

/// <summary>
/// Belirtilen ilçeye bağlı mahalleleri (veya ilçe belirtilmemişse tüm mahalleleri) listeler.
/// Herkese açık (anonim) erişilebilir.
/// </summary>
public sealed record GetNeighborhoodsQuery(Guid? DistrictId) : IRequest<Result<IReadOnlyCollection<NeighborhoodDto>>>;

public sealed class GetNeighborhoodsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetNeighborhoodsQuery, Result<IReadOnlyCollection<NeighborhoodDto>>>
{
    public async Task<Result<IReadOnlyCollection<NeighborhoodDto>>> Handle(
        GetNeighborhoodsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<Neighborhood>().Query();

        if (request.DistrictId.HasValue)
        {
            query = query.Where(neighborhood => neighborhood.DistrictId == request.DistrictId.Value);
        }

        var neighborhoods = await query
            .OrderBy(neighborhood => neighborhood.Name)
            .Select(neighborhood => new NeighborhoodDto(
                neighborhood.Id,
                neighborhood.DistrictId,
                neighborhood.Name,
                neighborhood.HeadmanFullName,
                neighborhood.HeadmanPhoneNumber,
                neighborhood.Population))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<NeighborhoodDto>>.Success(neighborhoods);
    }
}
