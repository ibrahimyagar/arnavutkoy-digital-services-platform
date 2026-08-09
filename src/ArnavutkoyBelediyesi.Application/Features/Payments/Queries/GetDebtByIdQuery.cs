using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;
using ArnavutkoyBelediyesi.Domain.Payments;
using MediatR;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Queries;

/// <summary>
/// Kimliğine göre bir borcu, güncel gecikme faizi hesaplanmış olarak getirir. Erişim kontrolü
/// (yalnızca borç sahibi veya Officer/Administrator) API katmanında yapılır.
/// </summary>
public sealed record GetDebtByIdQuery(Guid DebtId) : IRequest<Result<DebtDto>>;

public sealed class GetDebtByIdQueryHandler(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider, IOptions<PaymentOptions> paymentOptions)
    : IRequestHandler<GetDebtByIdQuery, Result<DebtDto>>
{
    public async Task<Result<DebtDto>> Handle(GetDebtByIdQuery request, CancellationToken cancellationToken)
    {
        var debt = await unitOfWork.Repository<Debt>()
            .GetByIdAsync(request.DebtId, cancellationToken)
            .ConfigureAwait(false);

        if (debt is null)
        {
            return Result<DebtDto>.Failure($"'{request.DebtId}' kimlikli borç bulunamadı.");
        }

        var dto = DebtMapper.ToDto(debt, dateTimeProvider.UtcNow, paymentOptions.Value.DailyOverdueInterestRatePercent);

        return Result<DebtDto>.Success(dto);
    }
}
