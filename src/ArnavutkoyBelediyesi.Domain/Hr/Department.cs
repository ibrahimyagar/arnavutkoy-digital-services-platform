using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Hr;

/// <summary>
/// Belediye departmanı (halka açık dizin). Identity rollerinden bağımsız referans veri.
/// </summary>
public sealed class Department : AuditableEntity
{
    private Department()
    {
        Name = string.Empty;
        Description = string.Empty;
    }

    private Department(string name, string description) : this()
    {
        Name = name;
        Description = description;
        IsActive = true;
    }

    public string Name { get; private set; }

    public string Description { get; private set; }

    public bool IsActive { get; private set; }

    public static Department Create(string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Departman adı boş olamaz.", nameof(name));
        }

        return new Department(name.Trim(), (description ?? string.Empty).Trim());
    }

    public void Rename(string name, string description)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Departman adı boş olamaz.", nameof(name));
        }

        Name = name.Trim();
        Description = (description ?? string.Empty).Trim();
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}
