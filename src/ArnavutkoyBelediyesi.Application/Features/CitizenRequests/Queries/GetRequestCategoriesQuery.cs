using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;

/// <summary>
/// Talep oluştururken seçilebilecek aktif kategorileri listeler. Herkese açık erişilebilir.
/// </summary>
public sealed record GetRequestCategoriesQuery : IRequest<Result<IReadOnlyCollection<RequestCategoryDto>>>;

public sealed class GetRequestCategoriesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetRequestCategoriesQuery, Result<IReadOnlyCollection<RequestCategoryDto>>>
{
    public async Task<Result<IReadOnlyCollection<RequestCategoryDto>>> Handle(
        GetRequestCategoriesQuery request,
        CancellationToken cancellationToken)
    {
        var categories = await unitOfWork.Repository<RequestCategory>()
            .Query()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .Select(c => new RequestCategoryDto(c.Id, c.Name))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<RequestCategoryDto>>.Success(categories);
    }
}
