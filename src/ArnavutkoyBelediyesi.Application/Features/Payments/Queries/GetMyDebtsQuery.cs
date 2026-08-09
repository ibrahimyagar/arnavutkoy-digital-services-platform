using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;
using ArnavutkoyBelediyesi.Domain.Payments;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Queries;

/// <summary>
/// Belirtilen vatandaşa ait borçları, güncel gecikme faizi hesaplanmış olarak sayfalı listeler.
/// Faiz hesaplaması yan etkisizdir; kalıcı bir yazma işlemi tetiklemez.
/// </summary>
public sealed record GetMyDebtsQuery(Guid DebtorUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<DebtDto>>>;

public sealed class GetMyDebtsQueryValidator : AbstractValidator<GetMyDebtsQuery>
{
    public GetMyDebtsQueryValidator()
    {
        RuleFor(x => x.DebtorUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMyDebtsQueryHandler(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    IOptions<PaymentOptions> paymentOptions)
    : IRequestHandler<GetMyDebtsQuery, Result<PaginatedList<DebtDto>>>
{
    public async Task<Result<PaginatedList<DebtDto>>> Handle(GetMyDebtsQuery request, CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<Debt>()
            .Query()
            .Where(debt => debt.DebtorUserId == request.DebtorUserId)
            .OrderBy(debt => debt.Status)
            .ThenBy(debt => debt.DueDateUtc);

        var debtsPage = await PaginatedList<Debt>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        var now = dateTimeProvider.UtcNow;
        var dailyRate = paymentOptions.Value.DailyOverdueInterestRatePercent;

        var items = debtsPage.Items
            .Select(debt => DebtMapper.ToDto(debt, now, dailyRate))
            .ToList();

        var page = new PaginatedList<DebtDto>(items, debtsPage.TotalCount, debtsPage.PageNumber, debtsPage.PageSize);

        return Result<PaginatedList<DebtDto>>.Success(page);
    }
}
