using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Payments.Events;

/// <summary>
/// Bir borç başarıyla ödendiğinde yükseltilen domain olayı (örn. makbuz e-postası
/// gönderilmesi gibi Infrastructure sorumlulukları için kullanılabilir).
/// </summary>
public sealed class DebtPaidDomainEvent(Guid debtId, Guid debtorUserId, Guid paymentId) : IDomainEvent
{
    /// <summary>
    /// Ödenen borcun kimliği.
    /// </summary>
    public Guid DebtId { get; } = debtId;

    /// <summary>
    /// Borç sahibinin kullanıcı kimliği.
    /// </summary>
    public Guid DebtorUserId { get; } = debtorUserId;

    /// <summary>
    /// Oluşturulan ödeme kaydının kimliği.
    /// </summary>
    public Guid PaymentId { get; } = paymentId;

    /// <inheritdoc />
    public DateTime OccurredOnUtc { get; } = DateTime.UtcNow;
}
