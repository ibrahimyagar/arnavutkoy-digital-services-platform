namespace ArnavutkoyBelediyesi.Domain.Notifications;

/// <summary>
/// Bildirimin iletileceği kanal. SMS/Push sonraki sürümlerde eklenebilir.
/// </summary>
public enum NotificationChannel
{
    Email = 0,
    InApp = 1,
}
