using ArnavutkoyBelediyesi.Domain.Notifications;

namespace ArnavutkoyBelediyesi.Application.Features.Notifications.Dtos;

public sealed record NotificationLogDto(
    Guid Id,
    Guid RecipientUserId,
    NotificationChannel Channel,
    string Subject,
    string Body,
    NotificationStatus Status,
    DateTime CreatedAtUtc,
    DateTime? SentAtUtc,
    string ErrorMessage);
