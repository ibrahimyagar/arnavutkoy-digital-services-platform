using Microsoft.Extensions.DependencyInjection;

namespace ArnavutkoyBelediyesi.Application;

/// <summary>
/// Application katmanına ait servislerin bağımlılık enjeksiyonu konteynerine kaydını sağlar.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// CQRS handler'ları, doğrulayıcıları ve application-level servisleri kaydeder.
    /// </summary>
    /// <param name="services">Servis koleksiyonu.</param>
    /// <returns>Zincirlenebilir servis koleksiyonu.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        return services;
    }
}
