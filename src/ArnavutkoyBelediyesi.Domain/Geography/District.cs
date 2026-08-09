using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Geography;

/// <summary>
/// Belediye sınırları içindeki bir ilçeyi temsil eder. Bu proje kapsamında tek bir ilçe
/// (Arnavutköy) üzerinde çalışılsa da yapı, çok ilçeli bir belediye/il yapısına genişleyebilir.
/// </summary>
public sealed class District : AuditableEntity
{
    private readonly List<Neighborhood> _neighborhoods = [];

    private District()
    {
        Name = string.Empty;
    }

    private District(string name) : this()
    {
        Name = name;
    }

    /// <summary>
    /// İlçe adı.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// İlçeye bağlı mahallelerin salt okunur listesi.
    /// </summary>
    public IReadOnlyCollection<Neighborhood> Neighborhoods => _neighborhoods.AsReadOnly();

    /// <summary>
    /// Yeni bir ilçe oluşturur.
    /// </summary>
    /// <param name="name">İlçe adı, boş olamaz.</param>
    public static District Create(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("İlçe adı boş olamaz.", nameof(name));
        }

        return new District(name.Trim());
    }

    /// <summary>
    /// İlçe adını günceller.
    /// </summary>
    public void Rename(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("İlçe adı boş olamaz.", nameof(newName));
        }

        Name = newName.Trim();
    }
}
