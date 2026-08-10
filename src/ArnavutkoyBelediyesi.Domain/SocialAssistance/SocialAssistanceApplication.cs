using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Exceptions;

namespace ArnavutkoyBelediyesi.Domain.SocialAssistance;

/// <summary>
/// Sosyal yardım başvurusu. Dinamik form yerine sabit alanlar + isteğe bağlı JSON esnek alan.
/// </summary>
public sealed class SocialAssistanceApplication : AuditableEntity
{
    private SocialAssistanceApplication()
    {
        HouseholdSummary = string.Empty;
        ExtraFieldsJson = "{}";
        ReviewNote = string.Empty;
    }

    private SocialAssistanceApplication(
        Guid applicantUserId,
        AssistanceType type,
        int householdSize,
        decimal monthlyIncome,
        string householdSummary,
        string extraFieldsJson,
        DateTime submittedAtUtc) : this()
    {
        ApplicantUserId = applicantUserId;
        Type = type;
        HouseholdSize = householdSize;
        MonthlyIncome = monthlyIncome;
        HouseholdSummary = householdSummary;
        ExtraFieldsJson = extraFieldsJson;
        Status = SocialAssistanceApplicationStatus.Submitted;
        SubmittedAtUtc = submittedAtUtc;
    }

    public Guid ApplicantUserId { get; private set; }

    public AssistanceType Type { get; private set; }

    public int HouseholdSize { get; private set; }

    public decimal MonthlyIncome { get; private set; }

    public string HouseholdSummary { get; private set; }

    /// <summary>
    /// Esnek ek alanlar (demo: JSON string; PostgreSQL'de text olarak tutulur).
    /// </summary>
    public string ExtraFieldsJson { get; private set; }

    public SocialAssistanceApplicationStatus Status { get; private set; }

    public DateTime SubmittedAtUtc { get; private set; }

    public DateTime? ReviewedAtUtc { get; private set; }

    public Guid? ReviewedByUserId { get; private set; }

    public string ReviewNote { get; private set; }

    public static SocialAssistanceApplication Submit(
        Guid applicantUserId,
        AssistanceType type,
        int householdSize,
        decimal monthlyIncome,
        string householdSummary,
        string? extraFieldsJson,
        DateTime submittedAtUtc)
    {
        if (applicantUserId == Guid.Empty)
        {
            throw new ArgumentException("Başvuran kimliği boş olamaz.", nameof(applicantUserId));
        }

        if (!Enum.IsDefined(type))
        {
            throw new ArgumentOutOfRangeException(nameof(type));
        }

        if (householdSize < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(householdSize), householdSize, "Hane büyüklüğü en az 1 olmalıdır.");
        }

        if (monthlyIncome < 0)
        {
            throw new ArgumentOutOfRangeException(nameof(monthlyIncome), monthlyIncome, "Gelir negatif olamaz.");
        }

        if (string.IsNullOrWhiteSpace(householdSummary))
        {
            throw new ArgumentException("Hane özeti boş olamaz.", nameof(householdSummary));
        }

        var json = string.IsNullOrWhiteSpace(extraFieldsJson) ? "{}" : extraFieldsJson.Trim();

        return new SocialAssistanceApplication(
            applicantUserId,
            type,
            householdSize,
            monthlyIncome,
            householdSummary.Trim(),
            json,
            submittedAtUtc);
    }

    public void StartReview(Guid reviewerUserId)
    {
        if (Status != SocialAssistanceApplicationStatus.Submitted)
        {
            throw new InvalidSocialAssistanceTransitionException(Status, "incelemeye alma");
        }

        Status = SocialAssistanceApplicationStatus.UnderReview;
        ReviewedByUserId = reviewerUserId;
    }

    public void Approve(Guid reviewerUserId, string? note, DateTime reviewedAtUtc)
    {
        EnsureReviewable();
        Status = SocialAssistanceApplicationStatus.Approved;
        ReviewedByUserId = reviewerUserId;
        ReviewedAtUtc = reviewedAtUtc;
        ReviewNote = (note ?? string.Empty).Trim();
    }

    public void Reject(Guid reviewerUserId, string note, DateTime reviewedAtUtc)
    {
        EnsureReviewable();
        if (string.IsNullOrWhiteSpace(note))
        {
            throw new ArgumentException("Red gerekçesi zorunludur.", nameof(note));
        }

        Status = SocialAssistanceApplicationStatus.Rejected;
        ReviewedByUserId = reviewerUserId;
        ReviewedAtUtc = reviewedAtUtc;
        ReviewNote = note.Trim();
    }

    public void Withdraw()
    {
        if (Status is not (SocialAssistanceApplicationStatus.Submitted or SocialAssistanceApplicationStatus.UnderReview))
        {
            throw new InvalidSocialAssistanceTransitionException(Status, "geri çekme");
        }

        Status = SocialAssistanceApplicationStatus.Withdrawn;
    }

    private void EnsureReviewable()
    {
        if (Status is not (SocialAssistanceApplicationStatus.Submitted or SocialAssistanceApplicationStatus.UnderReview))
        {
            throw new InvalidSocialAssistanceTransitionException(Status, "karar");
        }
    }
}
