using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Persistence;
using ArnavutkoyBelediyesi.Persistence.Identity;
using ArnavutkoyBelediyesi.Persistence.Seed;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Testcontainers.PostgreSql;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace ArnavutkoyBelediyesi.Api.IntegrationTests;

/// <summary>
/// Ortak Testcontainers + WebApplicationFactory altyapısı.
/// Seed kapsamı <see cref="SeedModules"/> ile belirlenir; üretim seed davranışı değişmez.
/// </summary>
public abstract class ApiFactoryBase : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _container;

    protected ApiFactoryBase(string databaseName)
    {
        _container = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .WithDatabase(databaseName)
            .WithUsername("test_user")
            .WithPassword("test_password")
            .Build();
    }

    /// <summary>Bu fabrika örneğinin seed edeceği demo veri modülleri.</summary>
    protected abstract DatabaseSeedModules SeedModules { get; }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureLogging(logging => logging.ClearProviders());
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IEmailSender>();
            services.AddSingleton<IEmailSender, CapturingEmailSender>();
        });
    }

    async Task IAsyncLifetime.InitializeAsync()
    {
        await _container.StartAsync();

        // Program.cs bağlantı dizesini Build öncesi ortam değişkeninden okur.
        // Koleksiyonlar seri çalışır (DisableTestParallelization); yine de her fabrika
        // kendi container bağlantısını set edip hemen Services'i oluşturur.
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

        await ApplicationDbContextSeeder.SeedAsync(
            context,
            userManager,
            roleManager,
            logger,
            SeedModules);
    }

    async Task IAsyncLifetime.DisposeAsync()
    {
        await _container.DisposeAsync();
        await base.DisposeAsync();
    }
}

/// <summary>Tam demo seed — Announcements, Transportation, Portal vb. dahil.</summary>
public sealed class ApiFactory : ApiFactoryBase
{
    public ApiFactory() : base("arnavutkoy_api_test")
    {
    }

    protected override DatabaseSeedModules SeedModules => DatabaseSeedModules.All;

    /// <summary>
    /// Seed edilen kurgusal demo kullanıcıların e-posta ve parolaları.
    /// Bkz. <see cref="ApplicationDbContextSeeder"/>.
    /// </summary>
    public static class DemoUsers
    {
        public const string CitizenEmail = "vatandas@demo.arnavutkoy.local";
        public const string CitizenPassword = "Demo!Citizen123";
        public const string OfficerEmail = "gorevli@demo.arnavutkoy.local";
        public const string OfficerPassword = "Demo!Officer123";
        public const string AdministratorEmail = "yonetici@demo.arnavutkoy.local";
        public const string AdministratorPassword = "Demo!Admin123";

        public const string CitizenNationalId = CitizenEmail;
        public const string OfficerNationalId = OfficerEmail;
        public const string AdministratorNationalId = AdministratorEmail;
    }
}

/// <summary>Yalnızca Identity (roller + demo kullanıcılar) — Auth uç nokta testleri için.</summary>
public sealed class AuthApiFactory : ApiFactoryBase
{
    public AuthApiFactory() : base("arnavutkoy_auth_test")
    {
    }

    protected override DatabaseSeedModules SeedModules => DatabaseSeedModules.IdentityOnly;
}

[CollectionDefinition(Name)]
public sealed class ApiCollection : ICollectionFixture<ApiFactory>
{
    public const string Name = "API Entegrasyon Testleri";
}

[CollectionDefinition(Name)]
public sealed class AuthApiCollection : ICollectionFixture<AuthApiFactory>
{
    public const string Name = "Auth API Entegrasyon Testleri";
}
