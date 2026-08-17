using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Persistence.Identity;
using ArnavutkoyBelediyesi.Persistence.Interceptors;
using ArnavutkoyBelediyesi.Persistence.Repositories;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArnavutkoyBelediyesi.Persistence;

/// <summary>
/// Persistence katmanına ait EF Core, PostgreSQL, Identity ve repository kayıtlarını sağlar.
/// </summary>
public static class DependencyInjection
{
    /// <summary>
    /// Veritabanı bağlamını, ASP.NET Core Identity mağazasını ve repository implementasyonlarını kaydeder.
    /// </summary>
    /// <param name="services">Servis koleksiyonu.</param>
    /// <param name="configuration">Bağlantı dizesinin okunacağı yapılandırma kaynağı.</param>
    /// <returns>Zincirlenebilir servis koleksiyonu.</returns>
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("'Default' bağlantı dizesi yapılandırılmamış.");

        // Scoped kayıt: AuditableEntitySaveChangesInterceptor, istek başına (scoped) olan
        // ICurrentUserService'e bağımlıdır; bir singleton'ın scoped bir servisi tüketmesi
        // (captive dependency) DI konteyneri tarafından reddedilir.
        services.AddScoped<AuditableEntitySaveChangesInterceptor>();
        services.AddScoped<DispatchDomainEventsInterceptor>();

        services.AddDbContext<ApplicationDbContext>((serviceProvider, options) =>
        {
            options.UseNpgsql(connectionString, npgsql => npgsql.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName));
            options.AddInterceptors(
                serviceProvider.GetRequiredService<AuditableEntitySaveChangesInterceptor>(),
                serviceProvider.GetRequiredService<DispatchDomainEventsInterceptor>());
        });

        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedAccount = false;
                options.SignIn.RequireConfirmedEmail = false;

                // Kaba kuvvet (brute-force) girişimlerine karşı hesap kilitleme; referans projede
                // bu koruma bulunmuyordu (bkz. ASSUMPTIONS.md).
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddSingleton<ILookupNormalizer, IdentityLookupNormalizer>();

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<ICitizenRequestRepository, CitizenRequestRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        return services;
    }
}
