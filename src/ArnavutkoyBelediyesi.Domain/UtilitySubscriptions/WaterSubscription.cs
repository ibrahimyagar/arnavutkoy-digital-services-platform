using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Exceptions;

namespace ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;

/// <summary>
/// Vatandaş su aboneliği. Su borçları (<c>DebtType.Water</c>) bu aboneliğe bağlı vatandaş
/// adına üretilir; abonelik kapalıyken borç açılamaz.
/// </summary>
public sealed class WaterSubscription : AuditableEntity
{
    private WaterSubscription()
    {
        SubscriptionNumber = string.Empty;
    }

    private WaterSubscription(
        Guid subscriberUserId,
        Guid neighborhoodId,
        Guid? propertyId,
        string subscriptionNumber,
        DateTime activatedAtUtc) : this()
    {
        SubscriberUserId = subscriberUserId;
        NeighborhoodId = neighborhoodId;
        PropertyId = propertyId;
        SubscriptionNumber = subscriptionNumber;
        Status = WaterSubscriptionStatus.Active;
        ActivatedAtUtc = activatedAtUtc;
    }

    /// <summary>
    /// Abone vatandaşın kullanıcı kimliği.
    /// </summary>
    public Guid SubscriberUserId { get; private set; }

    /// <summary>
    /// Aboneliğin bağlı olduğu mahalle.
    /// </summary>
    public Guid NeighborhoodId { get; private set; }

    /// <summary>
    /// İsteğe bağlı mülk bağlantısı (<see cref="Properties.CitizenProperty"/>).
    /// </summary>
    public Guid? PropertyId { get; private set; }

    /// <summary>
    /// Belediye abone numarası (demo; benzersiz).
    /// </summary>
    public string SubscriptionNumber { get; private set; }

    /// <summary>
    /// Abonelik durumu.
    /// </summary>
    public WaterSubscriptionStatus Status { get; private set; }

    /// <summary>
    /// Aboneliğin aktif edildiği UTC zaman.
    /// </summary>
    public DateTime ActivatedAtUtc { get; private set; }

    /// <summary>
    /// Aboneliğin kapatıldığı UTC zaman (açıksa null).
    /// </summary>
    public DateTime? ClosedAtUtc { get; private set; }

    /// <summary>
    /// Yeni bir aktif su aboneliği açar.
    /// </summary>
    public static WaterSubscription Open(
        Guid subscriberUserId,
        Guid neighborhoodId,
        Guid? propertyId,
        string subscriptionNumber,
        DateTime activatedAtUtc)
    {
        if (subscriberUserId == Guid.Empty)
        {
            throw new ArgumentException("Abone kimliği boş olamaz.", nameof(subscriberUserId));
        }

        if (neighborhoodId == Guid.Empty)
        {
            throw new ArgumentException("Mahalle kimliği boş olamaz.", nameof(neighborhoodId));
        }

        if (string.IsNullOrWhiteSpace(subscriptionNumber))
        {
            throw new ArgumentException("Abone numarası boş olamaz.", nameof(subscriptionNumber));
        }

        return new WaterSubscription(
            subscriberUserId,
            neighborhoodId,
            propertyId,
            subscriptionNumber.Trim().ToUpperInvariant(),
            activatedAtUtc);
    }

    /// <summary>
    /// Aboneliği askıya alır. Yalnızca Active → Suspended.
    /// </summary>
    public void Suspend()
    {
        EnsureNotClosed();
        if (Status != WaterSubscriptionStatus.Active)
        {
            throw new InvalidWaterSubscriptionStateException("Yalnızca aktif abonelik askıya alınabilir.");
        }

        Status = WaterSubscriptionStatus.Suspended;
    }

    /// <summary>
    /// Askıdaki aboneliği yeniden aktif eder.
    /// </summary>
    public void Reactivate()
    {
        EnsureNotClosed();
        if (Status != WaterSubscriptionStatus.Suspended)
        {
            throw new InvalidWaterSubscriptionStateException("Yalnızca askıdaki abonelik yeniden aktif edilebilir.");
        }

        Status = WaterSubscriptionStatus.Active;
    }

    /// <summary>
    /// Aboneliği kalıcı olarak kapatır.
    /// </summary>
    public void Close(DateTime closedAtUtc)
    {
        EnsureNotClosed();
        Status = WaterSubscriptionStatus.Closed;
        ClosedAtUtc = closedAtUtc;
    }

    /// <summary>
    /// Bu abonelik için su borcu üretilebilir mi?
    /// </summary>
    public bool CanGenerateDebt => Status == WaterSubscriptionStatus.Active;

    private void EnsureNotClosed()
    {
        if (Status == WaterSubscriptionStatus.Closed)
        {
            throw new InvalidWaterSubscriptionStateException("Kapalı abonelik üzerinde işlem yapılamaz.");
        }
    }
}
