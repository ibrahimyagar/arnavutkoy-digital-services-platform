using ArnavutkoyBelediyesi.Domain.Payments;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;

/// <summary>
/// <see cref="Debt"/> entity'sini, güncel gecikme faizi hesaplanmış <see cref="DebtDto"/>'ya
/// dönüştürür. Faiz hesaplaması entity'nin kendi yan etkisiz domain metodu üzerinden yapılır.
/// </summary>
internal static class DebtMapper
{
    public static DebtDto ToDto(Debt debt, DateTime asOfUtc, decimal dailyInterestRatePercent, Payment? payment = null)
    {
        var interest = debt.CalculateOverdueInterest(asOfUtc, dailyInterestRatePercent);
        var overdueDays = debt.Status == DebtStatus.Paid || asOfUtc.Date <= debt.DueDateUtc.Date
            ? 0
            : (asOfUtc.Date - debt.DueDateUtc.Date).Days;

        return new DebtDto(
            debt.Id,
            debt.DebtorUserId,
            debt.Type,
            debt.PrincipalAmount,
            interest,
            debt.PrincipalAmount + interest,
            debt.DueDateUtc,
            debt.Status,
            debt.PaidAtUtc,
            debt.CreatedAtUtc,
            overdueDays,
            debt.PaymentId,
            payment?.Amount,
            payment?.MaskedCardNumber);
    }
}
