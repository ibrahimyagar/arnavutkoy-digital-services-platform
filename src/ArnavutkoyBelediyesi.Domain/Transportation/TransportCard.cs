using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Exceptions;

namespace ArnavutkoyBelediyesi.Domain.Transportation;

/// <summary>
/// Vatandaş ulaşım kartı. Bakiye yükleme ve biniş simülasyonu domain kurallarıyla yönetilir.
/// </summary>
public sealed class TransportCard : AuditableEntity
{
    private TransportCard()
    {
        CardNumber = string.Empty;
    }

    private TransportCard(Guid ownerUserId, string cardNumber, decimal initialBalance) : this()
    {
        OwnerUserId = ownerUserId;
        CardNumber = cardNumber;
        Balance = initialBalance;
        IsActive = true;
    }

    public Guid OwnerUserId { get; private set; }

    public string CardNumber { get; private set; }

    public decimal Balance { get; private set; }

    public bool IsActive { get; private set; }

    public static TransportCard Issue(Guid ownerUserId, string cardNumber, decimal initialBalance = 0m)
    {
        if (ownerUserId == Guid.Empty)
        {
            throw new ArgumentException("Sahip kimliği boş olamaz.", nameof(ownerUserId));
        }

        if (string.IsNullOrWhiteSpace(cardNumber))
        {
            throw new ArgumentException("Kart numarası boş olamaz.", nameof(cardNumber));
        }

        if (initialBalance < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(initialBalance));
        }

        return new TransportCard(ownerUserId, cardNumber.Trim().ToUpperInvariant(), initialBalance);
    }

    public void TopUp(decimal amount)
    {
        EnsureActive();
        if (amount <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(amount), amount, "Yükleme tutarı sıfırdan büyük olmalıdır.");
        }

        Balance += amount;
    }

    public void ChargeFare(decimal fare)
    {
        EnsureActive();
        if (fare <= 0)
        {
            throw new ArgumentOutOfRangeException(nameof(fare), fare, "Ücret sıfırdan büyük olmalıdır.");
        }

        if (Balance < fare)
        {
            throw new InsufficientTransportBalanceException(Id, Balance, fare);
        }

        Balance -= fare;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;

    private void EnsureActive()
    {
        if (!IsActive)
        {
            throw new InvalidTransportCardStateException("Pasif kart üzerinde işlem yapılamaz.");
        }
    }
}
