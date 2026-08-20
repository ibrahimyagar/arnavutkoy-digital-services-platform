using ArnavutkoyBelediyesi.Domain.Notifications;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Yönetici tarafından tetiklenen demo/test bildirim isteği gövdesi.
/// </summary>
public sealed record SendTestNotificationRequest(
    Guid RecipientUserId,
    NotificationChannel Channel,
    string Subject,
    string Body);
