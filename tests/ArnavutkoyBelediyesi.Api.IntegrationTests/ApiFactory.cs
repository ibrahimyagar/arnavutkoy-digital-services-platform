using ArnavutkoyBelediyesi.Persistence;
using ArnavutkoyBelediyesi.Persistence.Identity;
using ArnavutkoyBelediyesi.Persistence.Seed;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Testcontainers.PostgreSql;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests;

/// <summary>
/// Uygulamanın tamamını (API + Application + Infrastructure + Persistence), gerçek bir
/// PostgreSQL container'ına karşı uçtan uca test etmek için <see cref="WebApplicationFactory{TEntryPoint}"/>.
/// Referans projedeki "yalnızca manuel/tarayıcı testleri yapıldı" pratiğinin düzeltilmiş hâli olarak,
/// tüm kritik akışlar (kimlik doğrulama, yetkilendirme, iş kuralları) otomatik olarak doğrulanır.
/// </summary>
public sealed class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("arnavutkoy_api_test")
        .WithUsername("test_user")
        .WithPassword("test_password")
        .Build();

    /// <summary>
    /// Seed edilen kurgusal demo kullanıcıların T.C. Kimlik Numaraları ve parolaları.
    /// Bkz. <see cref="ApplicationDbContextSeeder"/>.
    /// </summary>
    public static class DemoUsers
    {
        public const string CitizenNationalId = "10000000146";
        public const string CitizenPassword = "Demo!Citizen123";
        public const string OfficerNationalId = "10000000252";
        public const string OfficerPassword = "Demo!Officer123";
        public const string AdministratorNationalId = "10000000368";
        public const string AdministratorPassword = "Demo!Admin123";
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => logging.ClearProviders());
    }

    async Task IAsyncLifetime.InitializeAsync()
    {
        await _container.StartAsync();

        // Program.cs, JWT imzalama anahtarını ve bağlantı dizesini "builder.Build()" çağrısından
        // ÖNCE (fail-fast doğrulaması sırasında) okur. WebApplicationFactory'nin ConfigureWebHost/
        // ConfigureAppConfiguration kancaları ise yalnızca "Build()" anında devreye girer; bu nedenle
        // bu değerler, IConfiguration'ın en baştan (ConfigurationManager oluşturulurken) okuduğu
        // ortam değişkenleri üzerinden verilmelidir.
        Environment.SetEnvironmentVariable("ConnectionStrings__Default", _container.GetConnectionString());
        Environment.SetEnvironmentVariable("Jwt__Issuer", "arnavutkoy-api-tests");
        Environment.SetEnvironmentVariable("Jwt__Audience", "arnavutkoy-api-tests-audience");
        Environment.SetEnvironmentVariable("Jwt__AccessTokenLifetimeMinutes", "15");
        Environment.SetEnvironmentVariable("Jwt__RefreshTokenLifetimeDays", "7");
        Environment.SetEnvironmentVariable("Jwt__SigningKey", "api-entegrasyon-testleri-icin-32-karakterlik-gizli-anahtar");
        Environment.SetEnvironmentVariable("Swagger__Enabled", "true");

        using var scope = Services.CreateScope();
        var provider = scope.ServiceProvider;

        var context = provider.GetRequiredService<ApplicationDbContext>();
        await context.Database.MigrateAsync();

        var userManager = provider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = provider.GetRequiredService<RoleManager<ApplicationRole>>();
        var logger = provider.GetRequiredService<ILoggerFactory>().CreateLogger(nameof(ApplicationDbContextSeeder));

        await ApplicationDbContextSeeder.SeedAsync(context, userManager, roleManager, logger);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _container.DisposeAsync();
        await base.DisposeAsync();
    }
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "API Entegrasyon Testleri";
}
