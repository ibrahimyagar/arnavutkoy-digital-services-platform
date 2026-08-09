using Microsoft.Extensions.DependencyInjection;

namespace ArnavutkoyBelediyesi.Persistence;

/// <summary>
/// Persistence katmanına ait EF Core, repository ve unit of work kayıtlarını sağlar.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Veritabanı bağlamını ve repository implementasyonlarını kaydeder.
    /// </summary>
    /// <param name="services">Servis koleksiyonu.</param>
    /// <returns>Zincirlenebilir servis koleksiyonu.</returns>
    public static IServiceCollection AddPersistence(this IServiceCollection services)
    {
        return services;
    }
}
