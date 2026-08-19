using ArnavutkoyBelediyesi.Api.HealthChecks;
using ArnavutkoyBelediyesi.Persistence;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Uygulama ve PostgreSQL sağlık kontrollerinin kaydını sağlar. Docker Compose / orchestrator
/// healthcheck'leri ve yük dengeleyiciler <c>/health</c> uç noktasını kullanır.
/// </summary>
public static class HealthCheckExtensions
{
    public const string ReadyTag = "ready";

    public static IServiceCollection AddApiHealthChecks(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("'Default' bağlantı dizesi sağlık kontrolleri için yapılandırılmamış.");

        services.AddHealthChecks()
            .AddNpgSql(
                connectionString,
                name: "postgresql",
                failureStatus: HealthStatus.Unhealthy,
                tags: [ReadyTag])
            .AddCheck<DatabaseSeedHealthCheck>("database-seed", tags: [ReadyTag]);

        return services;
    }

    public static WebApplication MapApiHealthChecks(this WebApplication app)
    {
        // Liveness: uygulama ayaktaysa yeterli (Render port taraması / Docker HEALTHCHECK).
        app.MapHealthChecks("/health", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = _ => false,
        });

        app.MapHealthChecks("/health/ready", new Microsoft.AspNetCore.Diagnostics.HealthChecks.HealthCheckOptions
        {
            Predicate = check => check.Tags.Contains(ReadyTag),
        });

        return app;
    }
}
