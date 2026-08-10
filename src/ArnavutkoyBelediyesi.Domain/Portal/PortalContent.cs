using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Portal;

/// <summary>
/// Haber, etkinlik, faaliyet, kültür tesisi, hizmet rehberi ve kurumsal içerikler için ortak yayın modeli.
/// </summary>
public sealed class PortalContent : AuditableEntity
{
    private PortalContent()
    {
        Title = string.Empty;
        Summary = string.Empty;
        Body = string.Empty;
        Slug = string.Empty;
    }

    public PortalContentKind Kind { get; private set; }
    public string Title { get; private set; }
    public string Summary { get; private set; }
    public string Body { get; private set; }
    public string Slug { get; private set; }
    public string? Location { get; private set; }
    public string? Category { get; private set; }
    public DateTime? StartsAtUtc { get; private set; }
    public DateTime? EndsAtUtc { get; private set; }
    public bool IsPublished { get; private set; }
    public int SortOrder { get; private set; }

    public static PortalContent Create(
        PortalContentKind kind,
        string title,
        string summary,
        string body,
        string slug,
        string? location = null,
        string? category = null,
        DateTime? startsAtUtc = null,
        DateTime? endsAtUtc = null,
        int sortOrder = 0,
        bool publish = true)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(summary);
        ArgumentException.ThrowIfNullOrWhiteSpace(body);
        ArgumentException.ThrowIfNullOrWhiteSpace(slug);

        return new PortalContent
        {
            Kind = kind,
            Title = title.Trim(),
            Summary = summary.Trim(),
            Body = body.Trim(),
            Slug = slug.Trim().ToLowerInvariant(),
            Location = string.IsNullOrWhiteSpace(location) ? null : location.Trim(),
            Category = string.IsNullOrWhiteSpace(category) ? null : category.Trim(),
            StartsAtUtc = startsAtUtc,
            EndsAtUtc = endsAtUtc,
            SortOrder = sortOrder,
            IsPublished = publish,
        };
    }

    public void Publish() => IsPublished = true;
    public void Unpublish() => IsPublished = false;
}
