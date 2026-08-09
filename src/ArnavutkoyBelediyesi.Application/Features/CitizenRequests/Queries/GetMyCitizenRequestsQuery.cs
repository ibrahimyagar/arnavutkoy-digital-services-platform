using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;

/// <summary>
/// Belirtilen vatandaşa ait talepleri, mesaj detayı olmadan sayfalı olarak listeler.
/// </summary>
public sealed record GetMyCitizenRequestsQuery(Guid CitizenUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<CitizenRequestSummaryDto>>>;

public sealed class GetMyCitizenRequestsQueryValidator : AbstractValidator<GetMyCitizenRequestsQuery>
{
    public GetMyCitizenRequestsQueryValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMyCitizenRequestsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyCitizenRequestsQuery, Result<PaginatedList<CitizenRequestSummaryDto>>>
{
    public async Task<Result<PaginatedList<CitizenRequestSummaryDto>>> Handle(
        GetMyCitizenRequestsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<CitizenRequest>()
            .Query()
            .Where(r => r.CitizenUserId == request.CitizenUserId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(r => new CitizenRequestSummaryDto(r.Id, r.CategoryId, r.Status, r.CreatedAtUtc, r.ResolvedAtUtc));

        var page = await PaginatedList<CitizenRequestSummaryDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<CitizenRequestSummaryDto>>.Success(page);
    }
}
