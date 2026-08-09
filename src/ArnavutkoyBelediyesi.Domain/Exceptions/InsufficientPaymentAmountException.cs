namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Ödenen tutar, borcun (gecikme faizi dahil) toplam güncel bakiyesini karşılamadığında fırlatılır.
/// </summary>
public sealed class InsufficientPaymentAmountException : DomainException
{
    public InsufficientPaymentAmountException(decimal requiredAmount, decimal paidAmount)
        : base($"Ödenmesi gereken tutar {requiredAmount:C2} iken {paidAmount:C2} ödenmeye çalışıldı.")
    {
        RequiredAmount = requiredAmount;
        PaidAmount = paidAmount;
    }

    /// <summary>
    /// Ödenmesi gereken (faiz dahil) güncel tutar.
    /// </summary>
    public decimal RequiredAmount { get; }

    /// <summary>
    /// Kullanıcının ödemeye çalıştığı tutar.
    /// </summary>
    public decimal PaidAmount { get; }
}
