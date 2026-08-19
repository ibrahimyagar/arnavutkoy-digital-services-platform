using ArnavutkoyBelediyesi.Api.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ArnavutkoyBelediyesi.Api.HealthChecks;

/// <summary>
/// Seed açıksa arka plan seed'inin tamamlanmasını bekler; kapalıysa hazır kabul eder.
/// </summary>
public sealed class DatabaseSeedHealthCheck(DatabaseStartupState startupState, IConfiguration configuration, IHostEnvironment environment)
    : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var seedOnStartup = configuration.GetValue("Database:SeedOnStartup", defaultValue: environment.IsDevelopment());
        if (!seedOnStartup || environment.IsEnvironment("Testing"))
        {
            return Task.FromResult(HealthCheckResult.Healthy("Seed devre dışı veya test ortamı."));
        }

        if (startupState.SeedFailed)
        {
            return Task.FromResult(HealthCheckResult.Unhealthy(
                "Demo seed başarısız.",
                data: new Dictionary<string, object> { ["detail"] = startupState.SeedError ?? "unknown" }));
        }

        if (!startupState.SeedCompleted)
        {
            return Task.FromResult(HealthCheckResult.Degraded("Demo seed devam ediyor."));
        }

        return Task.FromResult(HealthCheckResult.Healthy("Demo seed tamamlandı."));
    }
}
