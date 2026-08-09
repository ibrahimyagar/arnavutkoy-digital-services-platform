using ArnavutkoyBelediyesi.Domain.Payments;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;

/// <summary>
/// Bir borcun, güncel gecikme faizi dahil hesaplanmış tutarlarla birlikte API görünümü.
/// </summary>
public sealed record DebtDto(
    Guid Id,
    Guid DebtorUserId,
    DebtType Type,
    decimal PrincipalAmount,
    decimal OverdueInterest,
    decimal TotalPayable,
    DateTime DueDateUtc,
    DebtStatus Status,
    DateTime? PaidAtUtc);

/// <summary>
/// Bir ödeme kaydının API görünümü.
/// </summary>
public sealed record PaymentDto(Guid Id, Guid DebtId, decimal Amount, string MaskedCardNumber, DateTime PaidAtUtc);
