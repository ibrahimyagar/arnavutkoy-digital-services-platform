using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Domain.Notifications;
using ArnavutkoyBelediyesi.Infrastructure.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

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
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();

        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IIdentityService, IdentityService>();
        services.AddNotificationSenders();
        services.AddEmailSender(configuration);

        return services;
    }

    /// <summary>
    /// Geriye dönük uyumluluk: yapılandırma olmadan çağrılırsa yalnızca log e-posta göndericisi kaydedilir.
    /// </summary>
    public static IServiceCollection AddInfrastructure(this IServiceCollection services) =>
        AddInfrastructure(services, new ConfigurationBuilder().Build());

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

    /// <summary>
    /// SMTP yapılandırılmışsa <see cref="SmtpEmailSender"/>, aksi halde <see cref="LoggingEmailSender"/>.
    /// </summary>
    public static IServiceCollection AddEmailSender(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));

        services.AddScoped<IEmailSender>(sp =>
        {
            var options = sp.GetRequiredService<IOptions<SmtpOptions>>().Value;
            if (options.IsConfigured)
            {
                return ActivatorUtilities.CreateInstance<SmtpEmailSender>(sp);
            }

            return ActivatorUtilities.CreateInstance<LoggingEmailSender>(sp);
        });

        return services;
    }
}
