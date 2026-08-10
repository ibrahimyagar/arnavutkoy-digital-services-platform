using ArnavutkoyBelediyesi.Persistence;
using ArnavutkoyBelediyesi.Persistence.Identity;
using ArnavutkoyBelediyesi.Persistence.Seed;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Uygulama başlangıcında migration + (isteğe bağlı) seed işlemlerini çalıştırır.
/// Referans projedeki "manuel SQL script / elle veri girişi" pratiğinin yerine, tek komutla
/// (<c>docker compose up</c>) ayağa kalkan, tutarlı bir demo ortamı sağlar.
/// </summary>
public static class DatabaseStartupExtensions
{
    /// <summary>
    /// Migration'ları uygular ve <c>Database:SeedOnStartup</c> açıksa kurgusal demo verisini oluşturur.
    /// "Testing" ortamında (WebApplicationFactory) atlanır; test fixture'ları kendi seed'lerini yönetir.
    /// </summary>
    public static async Task InitializeDatabaseAsync(this WebApplication app)
    {
        if (app.Environment.IsEnvironment("Testing"))
        {
            return;
        }

        await using var scope = app.Services.CreateAsyncScope();
        var services = scope.ServiceProvider;
        var logger = services.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(DatabaseStartupExtensions));
        var configuration = services.GetRequiredService<IConfiguration>();

        var context = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        var seedOnStartup = configuration.GetValue("Database:SeedOnStartup", defaultValue: true);

        try
        {
            if (seedOnStartup)
            {
                logger.LogInformation("Veritabanı migration + seed başlatılıyor...");
                await ApplicationDbContextSeeder.SeedAsync(context, userManager, roleManager, logger).ConfigureAwait(false);
                logger.LogInformation("Veritabanı migration + seed tamamlandı.");
            }
            else
            {
                logger.LogInformation("Yalnızca migration uygulanıyor (Database:SeedOnStartup=false)...");
                await context.Database.MigrateAsync().ConfigureAwait(false);
                logger.LogInformation("Migration tamamlandı.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Veritabanı başlangıç işlemleri başarısız oldu.");
            throw;
        }
    }
}
