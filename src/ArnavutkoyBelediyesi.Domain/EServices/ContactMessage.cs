using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public enum ContactMessageStatus
{
    New = 1,
    Read = 2,
    Closed = 3,
}

public sealed class ContactMessage : AuditableEntity
{
    private ContactMessage()
    {
        FullName = string.Empty;
        Email = string.Empty;
        Subject = string.Empty;
        Body = string.Empty;
    }

    public string FullName { get; private set; }
    public string Email { get; private set; }
    public string? Phone { get; private set; }
    public string Subject { get; private set; }
    public string Body { get; private set; }
    public ContactMessageStatus Status { get; private set; }
    public Guid? CitizenUserId { get; private set; }

    public static ContactMessage Create(
        string fullName,
        string email,
        string subject,
        string body,
        string? phone = null,
        Guid? citizenUserId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(subject);
        ArgumentException.ThrowIfNullOrWhiteSpace(body);

        return new ContactMessage
        {
            FullName = fullName.Trim(),
            Email = email.Trim(),
            Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim(),
            Subject = subject.Trim(),
            Body = body.Trim(),
            Status = ContactMessageStatus.New,
            CitizenUserId = citizenUserId,
        };
    }

    public void MarkRead() => Status = ContactMessageStatus.Read;
    public void Close() => Status = ContactMessageStatus.Closed;
}
