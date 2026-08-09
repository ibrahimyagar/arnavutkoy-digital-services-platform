using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Geography;

/// <summary>
/// Bir ilçeye bağlı mahalleyi; nüfus ve muhtarlık iletişim bilgileriyle birlikte temsil eder.
/// </summary>
public sealed class Neighborhood : AuditableEntity
{
    private Neighborhood()
    {
        Name = string.Empty;
        HeadmanFullName = string.Empty;
        HeadmanPhoneNumber = string.Empty;
    }

    private Neighborhood(Guid districtId, string name, string headmanFullName, string headmanPhoneNumber, int population)
        : this()
    {
        DistrictId = districtId;
        Name = name;
        HeadmanFullName = headmanFullName;
        HeadmanPhoneNumber = headmanPhoneNumber;
        Population = population;
    }

    /// <summary>
    /// Bağlı olduğu ilçenin kimliği.
    /// </summary>
    public Guid DistrictId { get; private set; }

    /// <summary>
    /// Mahalle adı.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Mahalle muhtarının adı soyadı (kurgusal demo verisi).
    /// </summary>
    public string HeadmanFullName { get; private set; }

    /// <summary>
    /// Mahalle muhtarının iletişim telefonu (kurgusal demo verisi).
    /// </summary>
    public string HeadmanPhoneNumber { get; private set; }

    /// <summary>
    /// Mahalle nüfusu.
    /// </summary>
    public int Population { get; private set; }

    /// <summary>
    /// Yeni bir mahalle kaydı oluşturur.
    /// </summary>
    public static Neighborhood Create(Guid districtId, string name, string headmanFullName, string headmanPhoneNumber, int population)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Mahalle adı boş olamaz.", nameof(name));
        }

        if (population < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(population), population, "Nüfus negatif olamaz.");
        }

        return new Neighborhood(districtId, name.Trim(), headmanFullName.Trim(), headmanPhoneNumber.Trim(), population);
    }

    /// <summary>
    /// Muhtarlık bilgilerini günceller.
    /// </summary>
    public void UpdateHeadman(string headmanFullName, string headmanPhoneNumber)
    {
        if (string.IsNullOrWhiteSpace(headmanFullName))
        {
            throw new ArgumentException("Muhtar adı boş olamaz.", nameof(headmanFullName));
        }

        HeadmanFullName = headmanFullName.Trim();
        HeadmanPhoneNumber = headmanPhoneNumber.Trim();
    }

    /// <summary>
    /// Nüfus bilgisini günceller (örn. yıllık TÜİK verisi güncellemesi).
    /// </summary>
    public void UpdatePopulation(int population)
    {
        if (population < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(population), population, "Nüfus negatif olamaz.");
        }

        Population = population;
    }
}
