using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public enum DocumentApplicationType
{
    Ikametgah = 1,
    VergiBorcuYoktur = 2,
    ImarDurumuBelgesi = 3,
    CevreTemizlik = 4,
    IsyeriRuhsat = 5,
    Diger = 99,
}

public enum DocumentApplicationStatus
{
    Submitted = 1,
    InReview = 2,
    Ready = 3,
    Rejected = 4,
    Closed = 5,
}

public sealed class DocumentApplication : AuditableEntity
{
    private DocumentApplication()
    {
        Title = string.Empty;
        Description = string.Empty;
        TrackingCode = string.Empty;
    }

    public Guid CitizenUserId { get; private set; }
    public DocumentApplicationType Type { get; private set; }
    public string Title { get; private set; }
    public string Description { get; private set; }
    public string TrackingCode { get; private set; }
    public DocumentApplicationStatus Status { get; private set; }
    public string? StaffNote { get; private set; }

    public static DocumentApplication Submit(
        Guid citizenUserId,
        DocumentApplicationType type,
        string title,
        string description,
        string trackingCode)
    {
        if (citizenUserId == Guid.Empty)
        {
            throw new ArgumentException("Vatandaş kimliği zorunludur.", nameof(citizenUserId));
        }

        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        ArgumentException.ThrowIfNullOrWhiteSpace(trackingCode);

        return new DocumentApplication
        {
            CitizenUserId = citizenUserId,
            Type = type,
            Title = title.Trim(),
            Description = description.Trim(),
            TrackingCode = trackingCode.Trim().ToUpperInvariant(),
            Status = DocumentApplicationStatus.Submitted,
        };
    }

    public void MarkInReview() => Status = DocumentApplicationStatus.InReview;

    public void MarkReady(string? staffNote = null)
    {
        Status = DocumentApplicationStatus.Ready;
        StaffNote = string.IsNullOrWhiteSpace(staffNote) ? null : staffNote.Trim();
    }

    public void Reject(string staffNote)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(staffNote);
        Status = DocumentApplicationStatus.Rejected;
        StaffNote = staffNote.Trim();
    }
}
