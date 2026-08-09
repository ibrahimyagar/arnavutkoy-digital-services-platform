using ArnavutkoyBelediyesi.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Testcontainers.PostgreSql;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests;

/// <summary>
/// Gerçek bir PostgreSQL 16 örneğini Docker container'ı olarak başlatan xUnit fixture'ı.
/// Testcontainers kullanımı, referans projedeki "sadece geliştirme ortamında test edildi, üretimde
/// farklı davranış gösterdi" riskini ortadan kaldırır; testler gerçek veritabanı motoruna karşı çalışır.
/// </summary>
public sealed class PostgreSqlFixture : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("arnavutkoy_test")
        .WithUsername("test_user")
        .WithPassword("test_password")
        .Build();

    public string ConnectionString => _container.GetConnectionString();

    public async Task InitializeAsync()
    {
        await _container.StartAsync();

        await using var context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync() => await _container.DisposeAsync();

    /// <summary>
    /// Container'a bağlı, üretim kodundaki hiçbir interceptor'ı içermeyen "çıplak" bir bağlam döner.
    /// Interceptor davranışını doğrulayan testler bunun yerine kendi bağlamlarını oluşturur.
    /// </summary>
    public ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(ConnectionString)
            .Options;

        return new ApplicationDbContext(options);
    }

    /// <summary>
    /// Üretim kodundaki gibi <c>SaveChanges</c> interceptor'larının takılı olduğu bir bağlam döner;
    /// audit alanlarının otomatik doldurulmasını ve soft-delete dönüşümünü doğrulayan testler için kullanılır.
    /// </summary>
    public ApplicationDbContext CreateContext(params IInterceptor[] interceptors)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseNpgsql(ConnectionString)
            .AddInterceptors(interceptors)
            .Options;

        return new ApplicationDbContext(options);
    }
}

[CollectionDefinition(Name)]
public sealed class DatabaseCollection : ICollectionFixture<PostgreSqlFixture>
{
    public const string Name = "PostgreSQL Veritabanı";
}
