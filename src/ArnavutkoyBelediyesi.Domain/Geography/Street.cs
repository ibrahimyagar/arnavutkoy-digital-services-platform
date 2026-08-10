using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Geography;

/// <summary>
/// Bir mahalleye bağlı sokağı temsil eder. Coğrafi hiyerarşi:
/// <c>District → Neighborhood → Street</c>.
/// </summary>
public sealed class Street : AuditableEntity
{
    private Street()
    {
        Name = string.Empty;
    }

    private Street(Guid neighborhoodId, string name) : this()
    {
        NeighborhoodId = neighborhoodId;
        Name = name;
    }

    /// <summary>
    /// Bağlı olduğu mahallenin kimliği.
    /// </summary>
    public Guid NeighborhoodId { get; private set; }

    /// <summary>
    /// Sokak adı.
    /// </summary>
    public string Name { get; private set; }

    /// <summary>
    /// Yeni bir sokak kaydı oluşturur.
    /// </summary>
    public static Street Create(Guid neighborhoodId, string name)
    {
        if (neighborhoodId == Guid.Empty)
        {
            throw new ArgumentException("Mahalle kimliği boş olamaz.", nameof(neighborhoodId));
        }

        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Sokak adı boş olamaz.", nameof(name));
        }

        return new Street(neighborhoodId, name.Trim());
    }

    /// <summary>
    /// Sokak adını günceller.
    /// </summary>
    public void Rename(string newName)
    {
        if (string.IsNullOrWhiteSpace(newName))
        {
            throw new ArgumentException("Sokak adı boş olamaz.", nameof(newName));
        }

        Name = newName.Trim();
    }
}
