using ArnavutkoyBelediyesi.Persistence;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Uygulama dinlemeye başlamadan önce yalnızca EF migration'larını uygular.
/// Demo seed ayrı bir hosted service ile arka planda çalışır.
/// </summary>
public static class DatabaseStartupExtensions
{
    /// <summary>
    /// Bekleyen migration'ları uygular. "Testing" ortamında atlanır.
    /// </summary>
    public static async Task ApplyMigrationsAsync(this WebApplication app)
    {
        if (app.Environment.IsEnvironment("Testing"))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(DatabaseStartupExtensions));
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        try
        {
            logger.LogInformation("Veritabanı migration'ları uygulanıyor...");
            await context.Database.MigrateAsync().ConfigureAwait(false);
            logger.LogInformation("Veritabanı migration'ları tamamlandı.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Veritabanı migration'ları başarısız oldu.");
            throw;
        }
    }
}
