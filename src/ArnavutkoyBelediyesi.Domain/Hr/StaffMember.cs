using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Hr;

/// <summary>
/// Halka açık personel dizini kaydı. Login hesabı değildir; iletişim ve unvan bilgisi taşır.
/// </summary>
public sealed class StaffMember : AuditableEntity
{
    private StaffMember()
    {
        FullName = string.Empty;
        Title = string.Empty;
        Email = string.Empty;
        PhoneNumber = string.Empty;
    }

    private StaffMember(
        Guid departmentId,
        string fullName,
        string title,
        string email,
        string phoneNumber) : this()
    {
        DepartmentId = departmentId;
        FullName = fullName;
        Title = title;
        Email = email;
        PhoneNumber = phoneNumber;
        IsActive = true;
    }

    public Guid DepartmentId { get; private set; }

    public string FullName { get; private set; }

    public string Title { get; private set; }

    public string Email { get; private set; }

    public string PhoneNumber { get; private set; }

    public bool IsActive { get; private set; }

    public static StaffMember Create(
        Guid departmentId,
        string fullName,
        string title,
        string email,
        string phoneNumber)
    {
        if (departmentId == Guid.Empty)
        {
            throw new ArgumentException("Departman kimliği boş olamaz.", nameof(departmentId));
        }

        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new ArgumentException("Personel adı boş olamaz.", nameof(fullName));
        }

        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Unvan boş olamaz.", nameof(title));
        }

        return new StaffMember(
            departmentId,
            fullName.Trim(),
            title.Trim(),
            (email ?? string.Empty).Trim(),
            (phoneNumber ?? string.Empty).Trim());
    }

    public void UpdateContact(string title, string email, string phoneNumber)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            throw new ArgumentException("Unvan boş olamaz.", nameof(title));
        }

        Title = title.Trim();
        Email = (email ?? string.Empty).Trim();
        PhoneNumber = (phoneNumber ?? string.Empty).Trim();
    }

    public void MoveToDepartment(Guid departmentId)
    {
        if (departmentId == Guid.Empty)
        {
            throw new ArgumentException("Departman kimliği boş olamaz.", nameof(departmentId));
        }

        DepartmentId = departmentId;
    }

    public void Deactivate() => IsActive = false;

    public void Activate() => IsActive = true;
}
