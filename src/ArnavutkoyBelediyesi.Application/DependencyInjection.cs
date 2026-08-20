using System.Reflection;
using ArnavutkoyBelediyesi.Application.Common.Behaviors;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Features.Auth;
using ArnavutkoyBelediyesi.Application.Features.Auth.Services;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ArnavutkoyBelediyesi.Application;

/// <summary>
/// Application katmanına ait servislerin bağımlılık enjeksiyonu konteynerine kaydını sağlar.
/// </summary>
public static class DependencyInjection
{
    private static readonly Assembly ApplicationAssembly = typeof(DependencyInjection).Assembly;

    /// <summary>
    /// CQRS handler'ları (MediatR), FluentValidation doğrulayıcılarını, pipeline davranışlarını
    /// ve iş kuralı yapılandırma seçeneklerini (ör. gecikme faizi oranı) kaydeder.
    /// </summary>
    /// <param name="services">Servis koleksiyonu.</param>
    /// <param name="configuration">Yapılandırma kaynağı.</param>
    /// <returns>Zincirlenebilir servis koleksiyonu.</returns>
    public static IServiceCollection AddApplication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddMediatR(mediatRConfiguration =>
        {
            mediatRConfiguration.RegisterServicesFromAssembly(ApplicationAssembly);
            mediatRConfiguration.AddOpenBehavior(typeof(UnhandledExceptionLoggingBehavior<,>));
            mediatRConfiguration.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        services.AddValidatorsFromAssembly(ApplicationAssembly);

        services.Configure<PaymentOptions>(configuration.GetSection(PaymentOptions.SectionName));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));

        services.AddScoped<AuthTokenIssuer>();
        services.AddScoped<IEmailVerificationIssuer, EmailVerificationIssuer>();

        return services;
    }
}
