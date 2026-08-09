using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.CitizenRequests;

/// <summary>
/// Vatandaş taleplerinin sınıflandırıldığı kategori (örn. "Altyapı Arızası", "Temizlik").
/// Referans projedeki sabit kodlanmış talep tiplerinin yerine, yönetici tarafından
/// veritabanı üzerinden yönetilebilen bir referans veri olarak tasarlanmıştır.
/// </summary>
public sealed class RequestCategory : AuditableEntity
{
    private RequestCategory()
    {
        Name = string.Empty;
    }

    private RequestCategory(string name) : this()
    {
        Name = name;
        IsActive = true;
    }

    /// <summary>
    /// Kategori adı.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Kategori aktif mi; pasif kategoriler yeni talep oluşturmada seçilemez.
    /// </summary>
    public bool IsActive { get; private set; }

    /// <summary>
    /// Yeni bir talep kategorisi oluşturur.
    /// </summary>
    public static RequestCategory Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Kategori adı boş olamaz.", nameof(name));
        }

        return new RequestCategory(name.Trim());
    }

    /// <summary>
    /// Kategoriyi pasif hale getirir.
    /// </summary>
    public void Deactivate() => IsActive = false;

    /// <summary>
    /// Kategoriyi aktif hale getirir.
    /// </summary>
    public void Activate() => IsActive = true;
}
