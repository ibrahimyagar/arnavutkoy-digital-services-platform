using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Properties;

/// <summary>
/// Vatandaşa ait, mahalle/sokak bazlı mülk kaydı. Emlak vergisi borcu (<c>DebtType.Property</c>)
/// ile kavramsal olarak ilişkilidir; borç oluşturma ayrı bir Payments akışıdır.
/// </summary>
public sealed class CitizenProperty : AuditableEntity
{
    private CitizenProperty()
    {
        Title = string.Empty;
        DoorNumber = string.Empty;
        BlockParcel = string.Empty;
    }

    private CitizenProperty(
        Guid ownerUserId,
        Guid neighborhoodId,
        Guid? streetId,
        PropertyType type,
        string title,
        string doorNumber,
        string blockParcel) : this()
    {
        OwnerUserId = ownerUserId;
        NeighborhoodId = neighborhoodId;
        StreetId = streetId;
        Type = type;
        Title = title;
        DoorNumber = doorNumber;
        BlockParcel = blockParcel;
        IsActive = true;
    }

    /// <summary>
    /// Mülk sahibi vatandaşın kullanıcı kimliği.
    /// </summary>
    public Guid OwnerUserId { get; private set; }

    /// <summary>
    /// Mülkün bulunduğu mahalle.
    /// </summary>
    public Guid NeighborhoodId { get; private set; }

    /// <summary>
    /// Mülkün bulunduğu sokak (opsiyonel; mahalle yeterli olabilir).
    /// </summary>
    public Guid? StreetId { get; private set; }

    /// <summary>
    /// Mülk türü.
    /// </summary>
    public PropertyType Type { get; private set; }

    /// <summary>
    /// Kısa tanım / başlık (örn. "Hadımköy konut").
    /// </summary>
    public string Title { get; private set; }

    /// <summary>
    /// Kapı / bağımsız bölüm numarası.
    /// </summary>
    public string DoorNumber { get; private set; }

    /// <summary>
    /// Ada/parsel bilgisi (kurgusal demo; resmi tapu entegrasyonu yok).
    /// </summary>
    public string BlockParcel { get; private set; }

    /// <summary>
    /// Mülk kaydının aktif olup olmadığı. Pasif kayıtlar listelerde filtrelenebilir.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Yeni bir mülk kaydı oluşturur.
    /// </summary>
    public static CitizenProperty Create(
        Guid ownerUserId,
        Guid neighborhoodId,
        Guid? streetId,
        PropertyType type,
        string title,
        string doorNumber,
        string blockParcel)
    {
        if (ownerUserId == Guid.Empty)
        {
            throw new ArgumentException("Sahip kimliği boş olamaz.", nameof(ownerUserId));
        }

        if (neighborhoodId == Guid.Empty)
        {
            throw new ArgumentException("Mahalle kimliği boş olamaz.", nameof(neighborhoodId));
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Mülk başlığı boş olamaz.", nameof(title));
        }

        if (string.IsNullOrWhiteSpace(doorNumber))
        {
            throw new ArgumentException("Kapı numarası boş olamaz.", nameof(doorNumber));
        }

        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type), type, "Geçersiz mülk türü.");
        }

        return new CitizenProperty(
            ownerUserId,
            neighborhoodId,
            streetId,
            type,
            title.Trim(),
            doorNumber.Trim(),
            (blockParcel ?? string.Empty).Trim());
    }

    /// <summary>
    /// Adres bilgilerini günceller. Sokak, mahalleye ait olmalıdır (uygulama katmanı doğrular).
    /// </summary>
    public void UpdateAddress(Guid neighborhoodId, Guid? streetId, string doorNumber, string blockParcel)
    {
        if (neighborhoodId == Guid.Empty)
        {
            throw new ArgumentException("Mahalle kimliği boş olamaz.", nameof(neighborhoodId));
        }

        if (string.IsNullOrWhiteSpace(doorNumber))
        {
            throw new ArgumentException("Kapı numarası boş olamaz.", nameof(doorNumber));
        }

        NeighborhoodId = neighborhoodId;
        StreetId = streetId;
        DoorNumber = doorNumber.Trim();
        BlockParcel = (blockParcel ?? string.Empty).Trim();
    }

    /// <summary>
    /// Mülk başlığını günceller.
    /// </summary>
    public void Rename(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Mülk başlığı boş olamaz.", nameof(title));
        }

        Title = title.Trim();
    }

    /// <summary>
    /// Mülk kaydını pasife alır (satış/taşınma simülasyonu). Soft delete değildir.
    /// </summary>
    public void Deactivate()
    {
        IsActive = false;
    }

    /// <summary>
    /// Pasif mülk kaydını yeniden aktif eder.
    /// </summary>
    public void Activate()
    {
        IsActive = true;
    }

    /// <summary>
    /// Bu mülk için emlak vergisi borcu üretilebilir mi?
    /// </summary>
    public bool CanGenerateDebt => IsActive;
}
