using ArnavutkoyBelediyesi.Domain.Portal;

namespace ArnavutkoyBelediyesi.Application.Features.Portal;

public sealed record PortalContentDto(
    Guid Id,
    string Kind,
    string Title,
    string Summary,
    string Body,
    string Slug,
    string? Location,
    string? Category,
    DateTime? StartsAtUtc,
    DateTime? EndsAtUtc,
    int SortOrder,
    DateTime CreatedAtUtc);

public static class PortalContentMapping
{
    public static PortalContentDto ToDto(PortalContent x) => new(
        x.Id,
        x.Kind.ToString(),
        x.Title,
        x.Summary,
        x.Body,
        x.Slug,
        x.Location,
        x.Category,
        x.StartsAtUtc,
        x.EndsAtUtc,
        x.SortOrder,
        x.CreatedAtUtc);
}
