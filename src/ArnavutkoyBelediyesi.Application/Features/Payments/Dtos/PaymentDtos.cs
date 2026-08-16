using ArnavutkoyBelediyesi.Domain.Payments;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;

/// <summary>
/// Bir borcun, güncel gecikme faizi dahil hesaplanmış tutarlarla birlikte API görünümü.
/// Ödenmiş kayıtlarda <see cref="PaidAmount"/> ödeme anındaki tahsilattır; açık borç
/// toplamına dahil edilmez.
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
    DateTime? PaidAtUtc,
    DateTime CreatedAtUtc,
    int OverdueDays,
    Guid? PaymentId,
    decimal? PaidAmount,
    string? MaskedCardNumber);

/// <summary>
/// Bir ödeme kaydının API görünümü.
/// </summary>
public sealed record PaymentDto(Guid Id, Guid DebtId, decimal Amount, string MaskedCardNumber, DateTime PaidAtUtc);
