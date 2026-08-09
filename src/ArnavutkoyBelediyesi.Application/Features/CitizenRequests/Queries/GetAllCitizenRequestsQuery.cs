using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;

/// <summary>
/// Tüm vatandaş taleplerini, isteğe bağlı durum filtresiyle sayfalı olarak listeler.
/// Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record GetAllCitizenRequestsQuery(RequestStatus? Status, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<CitizenRequestSummaryDto>>>;

public sealed class GetAllCitizenRequestsQueryValidator : AbstractValidator<GetAllCitizenRequestsQuery>
{
    public GetAllCitizenRequestsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetAllCitizenRequestsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAllCitizenRequestsQuery, Result<PaginatedList<CitizenRequestSummaryDto>>>
{
    public async Task<Result<PaginatedList<CitizenRequestSummaryDto>>> Handle(
        GetAllCitizenRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<CitizenRequest>().Query();

        if (request.Status.HasValue)
        {
            query = query.Where(r => r.Status == request.Status.Value);
        }

        var projected = query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new CitizenRequestSummaryDto(r.Id, r.CategoryId, r.Status, r.CreatedAtUtc, r.ResolvedAtUtc));

        var page = await PaginatedList<CitizenRequestSummaryDto>
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<CitizenRequestSummaryDto>>.Success(page);
    }
}
