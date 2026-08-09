namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Ortama göre değişen bir CORS politikasının kaydını sağlar: geliştirmede herhangi bir origin'e
/// izin verilir (gevşek), üretimde ise yalnızca <c>Cors:AllowedOrigins</c> altında listelenen
/// origin'lere izin verilir (whitelist).
/// </summary>
public static class CorsExtensions
{
    public const string PolicyName = "Default";

    public static IServiceCollection AddApiCors(
        this IServiceCollection services,
        IConfiguration configuration,
        IWebHostEnvironment environment)
    {
        services.AddCors(options =>
        {
            options.AddPolicy(PolicyName, policy =>
            {
                if (environment.IsDevelopment())
                {
                    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
                    return;
                }

                var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
                policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
            });
        });

        return services;
    }
}
