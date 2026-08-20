using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Notifications;
using ArnavutkoyBelediyesi.Infrastructure.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Infrastructure;

/// <summary>
/// Infrastructure katmanına ait dış servis entegrasyonlarının (kimlik doğrulama, token üretimi,
/// zaman sağlayıcı, geçerli kullanıcı bilgisi) bağımlılık enjeksiyonu kaydını sağlar.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Infrastructure servislerini kaydeder.
    /// </summary>
    /// <param name="services">Servis koleksiyonu.</param>
    /// <returns>Zincirlenebilir servis koleksiyonu.</returns>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();

        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddNotificationSenders();

        return services;
    }

    /// <summary>
    /// Bildirim kanalı göndericilerini kaydeder. İleride SMS/Push implementasyonları aynı arayüze eklenebilir.
    /// </summary>
    public static IServiceCollection AddNotificationSenders(this IServiceCollection services)
    {
        services.AddSingleton<INotificationSender>(sp =>
            new LoggingNotificationSender(
                sp.GetRequiredService<ILogger<LoggingNotificationSender>>(),
                NotificationChannel.Email));

        services.AddSingleton<INotificationSender>(sp =>
            new LoggingNotificationSender(
                sp.GetRequiredService<ILogger<LoggingNotificationSender>>(),
                NotificationChannel.InApp));

        return services;
    }
}
