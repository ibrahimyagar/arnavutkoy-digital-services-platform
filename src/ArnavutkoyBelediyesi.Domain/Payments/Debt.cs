using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.Payments.Events;

namespace ArnavutkoyBelediyesi.Domain.Payments;

/// <summary>
/// Bir vatandaşın belediyeye olan borcunu temsil eder. Gecikme faizi hesaplaması yan etkisiz
/// (side-effect-free) bir domain metoduyla yapılır; kalıcı durum değişikliği yalnızca
/// <see cref="MarkAsPaid"/> çağrıldığında gerçekleşir. Bu, referans projedeki "sayfa her
/// açıldığında ceza yeniden hesaplanıp veritabanına yazılır" anti-pattern'inin düzeltilmiş hâlidir.
/// </summary>
public sealed class Debt : AuditableEntity
{
    private Debt()
    {
    }

    private Debt(Guid debtorUserId, DebtType type, decimal principalAmount, DateTime dueDateUtc) : this()
    {
        DebtorUserId = debtorUserId;
        Type = type;
        PrincipalAmount = principalAmount;
        DueDateUtc = dueDateUtc;
        Status = DebtStatus.Unpaid;
    }

    /// <summary>
    /// Borçlu vatandaşın kullanıcı kimliği.
    /// </summary>
    public Guid DebtorUserId { get; private set; }

    /// <summary>
    /// Borcun türü.
    /// </summary>
    public DebtType Type { get; private set; }

    /// <summary>
    /// Faiz hariç asıl borç tutarı.
    /// </summary>
    public decimal PrincipalAmount { get; private set; }

    /// <summary>
    /// Borcun son ödeme (vade) tarihi.
    /// </summary>
    public DateTime DueDateUtc { get; private set; }

    /// <summary>
    /// Borcun ödeme durumu.
    /// </summary>
    public DebtStatus Status { get; private set; }

    /// <summary>
    /// Borcun ödendiği UTC zaman (ödenmediyse null).
    /// </summary>
    public DateTime? PaidAtUtc { get; private set; }

    /// <summary>
    /// Borcu ödeyen işlem kaydının kimliği (ödenmediyse null).
    /// </summary>
    public Guid? PaymentId { get; private set; }

    /// <summary>
    /// Yeni bir borç kaydı oluşturur.
    /// </summary>
    public static Debt Create(Guid debtorUserId, DebtType type, decimal principalAmount, DateTime dueDateUtc)
    {
        if (principalAmount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(principalAmount), principalAmount, "Borç tutarı sıfırdan büyük olmalıdır.");
        }

        return new Debt(debtorUserId, type, principalAmount, dueDateUtc);
    }

    /// <summary>
    /// Belirtilen tarih itibarıyla vade aşımı gecikme faizini hesaplar. Vade aşılmamışsa veya
    /// borç zaten ödenmişse 0 döner. Sonuç kalıcı hale getirilmez; salt okunur bir hesaplamadır.
    /// </summary>
    /// <param name="asOfUtc">Hesaplamanın yapılacağı referans UTC zamanı.</param>
    /// <param name="dailyInterestRatePercent">Belediye tarafından belirlenen günlük faiz oranı (%).</param>
    public decimal CalculateOverdueInterest(DateTime asOfUtc, decimal dailyInterestRatePercent)
    {
        if (Status == DebtStatus.Paid || asOfUtc.Date <= DueDateUtc.Date)
        {
            return 0m;
        }

        var overdueDays = (asOfUtc.Date - DueDateUtc.Date).Days;
        var interest = PrincipalAmount * (dailyInterestRatePercent / 100m) * overdueDays;

        return Math.Round(interest, 2, MidpointRounding.AwayFromZero);
    }

    /// <summary>
    /// Belirtilen tarih itibarıyla ödenmesi gereken toplam tutarı (asıl borç + gecikme faizi) hesaplar.
    /// </summary>
    public decimal CalculateTotalPayable(DateTime asOfUtc, decimal dailyInterestRatePercent)
        => PrincipalAmount + CalculateOverdueInterest(asOfUtc, dailyInterestRatePercent);

    /// <summary>
    /// Borcu ödenmiş olarak işaretler. Zaten ödenmiş bir borç için tekrar çağrılırsa
    /// <see cref="DebtAlreadyPaidException"/> fırlatılır (idempotency koruması).
    /// </summary>
    public void MarkAsPaid(Guid paymentId, DateTime paidAtUtc)
    {
        if (Status == DebtStatus.Paid)
        {
            throw new DebtAlreadyPaidException(Id);
        }

        Status = DebtStatus.Paid;
        PaidAtUtc = paidAtUtc;
        PaymentId = paymentId;

        RaiseDomainEvent(new DebtPaidDomainEvent(Id, DebtorUserId, paymentId));
    }
}
