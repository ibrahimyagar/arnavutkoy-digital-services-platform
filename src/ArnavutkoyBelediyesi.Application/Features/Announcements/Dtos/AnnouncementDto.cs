using ArnavutkoyBelediyesi.Domain.Announcements;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Dtos;

/// <summary>
/// Bir duyurunun API'ye sunulan görünümü.
/// </summary>
public sealed record AnnouncementDto(
    Guid Id,
    string Title,
    string Content,
    AnnouncementStatus Status,
    DateTime? PublishStartUtc,
    DateTime? PublishEndUtc,
    DateTime CreatedAtUtc);
