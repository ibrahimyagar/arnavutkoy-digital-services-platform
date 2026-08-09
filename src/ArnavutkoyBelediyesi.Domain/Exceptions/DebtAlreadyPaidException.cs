namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Zaten ödenmiş bir borç için tekrar ödeme işlemi denendiğinde fırlatılır.
/// Bu kontrol, aynı borcun iki kez ödenmesini (idempotency ihlalini) domain seviyesinde önler.
/// </summary>
public sealed class DebtAlreadyPaidException : DomainException
{
    public DebtAlreadyPaidException(Guid debtId)
        : base($"'{debtId}' kimlikli borç zaten ödenmiştir.")
    {
        DebtId = debtId;
    }

    /// <summary>
    /// Zaten ödenmiş olan borcun kimliği.
    /// </summary>
    public Guid DebtId { get; }
}
