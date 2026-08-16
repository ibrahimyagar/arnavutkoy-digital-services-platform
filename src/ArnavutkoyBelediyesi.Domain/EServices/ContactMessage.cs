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
        TrackingCode = string.Empty;
        PreferredReply = string.Empty;
    }

    public string FullName { get; private set; }
    public string Email { get; private set; }
    public string? Phone { get; private set; }
    public string Subject { get; private set; }
    public string Body { get; private set; }
    public string TrackingCode { get; private set; }
    public string PreferredReply { get; private set; }
    public ContactMessageStatus Status { get; private set; }
    public Guid? CitizenUserId { get; private set; }

    public static ContactMessage Create(
        string fullName,
        string email,
        string subject,
        string body,
        string trackingCode,
        string preferredReply,
        string? phone = null,
        Guid? citizenUserId = null)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fullName);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        ArgumentException.ThrowIfNullOrWhiteSpace(subject);
        ArgumentException.ThrowIfNullOrWhiteSpace(body);
        ArgumentException.ThrowIfNullOrWhiteSpace(trackingCode);

        var reply = string.IsNullOrWhiteSpace(preferredReply) ? "Email" : preferredReply.Trim();
        if (reply is not ("Email" or "Phone"))
        {
            throw new ArgumentException("Geri dönüş yöntemi E-posta veya Telefon olmalıdır.", nameof(preferredReply));
        }

        return new ContactMessage
        {
            FullName = fullName.Trim(),
            Email = email.Trim(),
            Phone = string.IsNullOrWhiteSpace(phone) ? null : phone.Trim(),
            Subject = subject.Trim(),
            Body = body.Trim(),
            TrackingCode = trackingCode.Trim().ToUpperInvariant(),
            PreferredReply = reply,
            Status = ContactMessageStatus.New,
            CitizenUserId = citizenUserId,
        };
    }

    public void MarkRead() => Status = ContactMessageStatus.Read;
    public void Close() => Status = ContactMessageStatus.Closed;
}
