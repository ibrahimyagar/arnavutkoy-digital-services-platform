using Microsoft.Extensions.DependencyInjection;

namespace ArnavutkoyBelediyesi.Infrastructure;

/// <summary>
/// Infrastructure katmanına ait dış servis entegrasyonlarının (kimlik doğrulama, token üretimi,
/// zaman sağlayıcı vb.) bağımlılık enjeksiyonu kaydını sağlar.
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
        return services;
    }
}
