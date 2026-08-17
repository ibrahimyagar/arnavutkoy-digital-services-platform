using System.Security.Claims;
using System.Text;
using ArnavutkoyBelediyesi.Application.Common.Options;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// JWT tabanlı kimlik doğrulama şemasının kaydını sağlar.
/// </summary>
public static class AuthenticationExtensions
{
    /// <summary>
    /// JWT Bearer kimlik doğrulamasını, <c>Jwt</c> yapılandırma bölümündeki değerlerle yapılandırır.
    /// İmzalama anahtarının en az 256 bit (32 bayt) uzunluğunda olduğu, uygulama başlangıcında
    /// (fail-fast) denetlenir; zayıf bir anahtarla üretime çıkılması bu şekilde engellenir.
    /// </summary>
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
            ?? throw new InvalidOperationException("'Jwt' yapılandırma bölümü bulunamadı.");

        if (Encoding.UTF8.GetByteCount(jwtOptions.SigningKey) < 32)
        {
            throw new InvalidOperationException(
                "'Jwt:SigningKey' en az 32 bayt (256 bit) uzunluğunda, gizli bir değer olarak yapılandırılmalıdır. " +
                "Değeri appsettings.json'a yazmayın; dev'de 'dotnet user-secrets', prod'da ortam değişkeni kullanın.");
        }

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidateAudience = true,
                    ValidAudience = jwtOptions.Audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.FromSeconds(30),
                    NameClaimType = ClaimTypes.NameIdentifier,
                    RoleClaimType = ClaimTypes.Role,
                };
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() is not null)
                        {
                            context.NoResult();
                        }

                        return Task.CompletedTask;
                    },
                    OnChallenge = context =>
                    {
                        if (context.HttpContext.GetEndpoint()?.Metadata.GetMetadata<IAllowAnonymous>() is not null)
                        {
                            context.HandleResponse();
                        }

                        return Task.CompletedTask;
                    },
                };
            });

        return services;
    }
}
