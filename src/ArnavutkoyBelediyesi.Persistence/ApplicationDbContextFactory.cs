using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace ArnavutkoyBelediyesi.Persistence;

/// <summary>
/// <c>dotnet ef</c> tasarım zamanı araçlarının (migration oluşturma/uygulama), çalışan bir
/// uygulama host'u olmadan <see cref="ApplicationDbContext"/> örneği oluşturabilmesi için
/// kullanılan fabrika. Interceptor'lar ve Identity servisleri gibi çalışma zamanına özgü
/// bağımlılıklar kasıtlı olarak burada kurulmaz; bu sınıf yalnızca migration üretimi içindir.
/// </summary>
public sealed class ApplicationDbContextFactory : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddUserSecrets("ec46bf70-c209-41c2-8ced-021fb41bf72d")
            .AddEnvironmentVariables()
            .Build();

        var connectionString = configuration.GetConnectionString("Default")
            ?? configuration["ConnectionStrings:Default"]
            ?? "Host=localhost;Port=5432;Database=arnavutkoy_belediyesi;Username=postgres;Password=postgres";

        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
        optionsBuilder.UseNpgsql(connectionString, npgsql =>
            npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}
