using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Payments;

/// <summary>
/// Bir borç ödemesinin kaydını temsil eder. Bilinçli bir güvenlik/uyumluluk kararı olarak
/// bu entity kart numarasının tamamını veya CVV'yi ASLA saklamaz; yalnızca maskelenmiş kart
/// numarası (ilk 4 - son 4 hane) ve kart sahibinin adı tutulur. Bu, PCI-DSS kapsamını
/// daraltmak amacıyla bilinçli olarak alınmış bir tasarım kararıdır (bkz. ARCHITECTURE.md).
/// </summary>
public sealed class Payment : AuditableEntity
{
    private Payment()
    {
        CardHolderName = string.Empty;
        MaskedCardNumber = string.Empty;
    }

    private Payment(Guid debtId, Guid payerUserId, decimal amount, string cardHolderName, string maskedCardNumber)
        : this()
    {
        DebtId = debtId;
        PayerUserId = payerUserId;
        Amount = amount;
        CardHolderName = cardHolderName;
        MaskedCardNumber = maskedCardNumber;
        PaidAtUtc = DateTime.UtcNow;
    }

    /// <summary>
    /// Ödemesi yapılan borcun kimliği.
    /// </summary>
    public Guid DebtId { get; private set; }

    /// <summary>
    /// Ödemeyi yapan kullanıcının kimliği.
    /// </summary>
    public Guid PayerUserId { get; private set; }

    /// <summary>
    /// Ödenen tutar (asıl borç + varsa gecikme faizi).
    /// </summary>
    public decimal Amount { get; private set; }

    /// <summary>
    /// Kart üzerindeki ad soyad.
    /// </summary>
    public string CardHolderName { get; private set; }

    /// <summary>
    /// Maskelenmiş kart numarası (örn. "5312********9821"). Tam numara asla saklanmaz.
    /// </summary>
    public string MaskedCardNumber { get; private set; }

    /// <summary>
    /// Ödemenin gerçekleştiği UTC zaman.
    /// </summary>
    public DateTime PaidAtUtc { get; private set; }

    /// <summary>
    /// Yeni bir ödeme kaydı oluşturur. Tam kart numarası yalnızca maskeleme için kullanılır,
    /// hiçbir alanda saklanmaz.
    /// </summary>
    /// <param name="debtId">Ödemesi yapılan borcun kimliği.</param>
    /// <param name="payerUserId">Ödemeyi yapan kullanıcının kimliği.</param>
    /// <param name="amount">Ödenen tutar, sıfırdan büyük olmalıdır.</param>
    /// <param name="cardHolderName">Kart sahibinin adı soyadı.</param>
    /// <param name="fullCardNumber">Yalnızca maskeleme amacıyla kullanılan, saklanmayan tam kart numarası.</param>
    public static Payment Create(Guid debtId, Guid payerUserId, decimal amount, string cardHolderName, string fullCardNumber)
    {
        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), amount, "Ödeme tutarı sıfırdan büyük olmalıdır.");
        }

        if (string.IsNullOrWhiteSpace(cardHolderName))
        {
            throw new ArgumentException("Kart sahibi adı boş olamaz.", nameof(cardHolderName));
        }

        var digitsOnly = new string(fullCardNumber.Where(char.IsDigit).ToArray());

        if (digitsOnly.Length < 12)
        {
            throw new ArgumentException("Geçersiz kart numarası.", nameof(fullCardNumber));
        }

        return new Payment(debtId, payerUserId, amount, cardHolderName.Trim(), MaskCardNumber(digitsOnly));
    }

    private static string MaskCardNumber(string digitsOnly)
    {
        const int visibleDigits = 4;

        if (digitsOnly.Length <= visibleDigits * 2)
        {
            return new string('*', digitsOnly.Length);
        }

        var first = digitsOnly[..visibleDigits];
        var last = digitsOnly[^visibleDigits..];
        var maskedMiddleLength = digitsOnly.Length - (visibleDigits * 2);

        return $"{first}{new string('*', maskedMiddleLength)}{last}";
    }
}
