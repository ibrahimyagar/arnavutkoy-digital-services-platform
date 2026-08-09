using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;
using ArnavutkoyBelediyesi.Domain.Geography;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Queries;

/// <summary>
/// Tüm ilçeleri, bağlı mahalle sayısıyla birlikte listeler. Herkese açık (anonim) erişilebilir.
/// </summary>
public sealed record GetDistrictsQuery : IRequest<Result<IReadOnlyCollection<DistrictDto>>>;

public sealed class GetDistrictsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetDistrictsQuery, Result<IReadOnlyCollection<DistrictDto>>>
{
    public async Task<Result<IReadOnlyCollection<DistrictDto>>> Handle(
        GetDistrictsQuery request,
        CancellationToken cancellationToken)
    {
        var districts = await unitOfWork.Repository<District>()
            .Query()
            .Include(district => district.Neighborhoods)
            .OrderBy(district => district.Name)
            .Select(district => new DistrictDto(district.Id, district.Name, district.Neighborhoods.Count))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<DistrictDto>>.Success(districts);
    }
}
