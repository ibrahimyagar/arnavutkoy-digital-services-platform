using ArnavutkoyBelediyesi.Persistence;
using ArnavutkoyBelediyesi.Persistence.Identity;
using ArnavutkoyBelediyesi.Persistence.Seed;
using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Demo seed'i uygulama dinlemeye başladıktan sonra arka planda çalıştırır.
/// Render gibi ortamlarda port taraması migration/seed bitmeden zaman aşımına uğramasın diye
/// seed startup'ı bloklamaz.
/// </summary>
public sealed class DatabaseSeedHostedService(
    IServiceScopeFactory scopeFactory,
    IConfiguration configuration,
    IHostEnvironment environment,
    DatabaseStartupState startupState,
    ILogger<DatabaseSeedHostedService> logger) : IHostedService
{
    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (environment.IsEnvironment("Testing"))
        {
            startupState.MarkSeedCompleted();
            return Task.CompletedTask;
        }

        var seedOnStartup = configuration.GetValue("Database:SeedOnStartup", defaultValue: environment.IsDevelopment());
        if (!seedOnStartup)
        {
            logger.LogInformation("Database:SeedOnStartup kapalı; demo seed atlanıyor.");
            startupState.MarkSeedCompleted();
            return Task.CompletedTask;
        }

        _ = RunSeedAsync(cancellationToken);
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;

    private async Task RunSeedAsync(CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Demo verisi seed işlemi arka planda başlatılıyor...");
            await using var scope = scopeFactory.CreateAsyncScope();
            var services = scope.ServiceProvider;
            var context = services.GetRequiredService<ApplicationDbContext>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();
            var seedLogger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(ApplicationDbContextSeeder));

            await ApplicationDbContextSeeder.SeedDataAsync(context, userManager, roleManager, seedLogger, cancellationToken)
                .ConfigureAwait(false);

            startupState.MarkSeedCompleted();
            logger.LogInformation("Demo verisi seed işlemi tamamlandı.");
        }
        catch (Exception ex)
        {
            startupState.MarkSeedFailed(ex.Message);
            logger.LogError(ex, "Demo verisi seed işlemi başarısız oldu.");
        }
    }
}
