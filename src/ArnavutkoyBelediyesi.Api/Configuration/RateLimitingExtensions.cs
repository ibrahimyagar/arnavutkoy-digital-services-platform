using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// İstemci IP adresine göre bölümlenmiş (partitioned) hız sınırlama politikalarının kaydını sağlar.
/// Kimlik doğrulama uç noktaları (giriş, kayıt, token yenileme), kaba kuvvet (brute-force) ve
/// kimlik bilgisi doldurma (credential stuffing) saldırılarına karşı daha sıkı bir politikayla korunur.
/// </summary>
public static class RateLimitingExtensions
{
    /// <summary>
    /// Kimlik doğrulama uç noktalarında <c>[EnableRateLimiting(AuthPolicyName)]</c> ile kullanılacak politika adı.
    /// </summary>
    public const string AuthPolicyName = "auth";

    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services)
    {
        services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                await context.HttpContext.Response.WriteAsJsonAsync(
                    new ProblemDetails
                    {
                        Status = StatusCodes.Status429TooManyRequests,
                        Title = "Çok fazla deneme",
                        Detail = "Kısa süre sonra tekrar deneyin.",
                    },
                    cancellationToken).ConfigureAwait(false);
            };

            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    ResolvePartitionKey(context),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        Window = TimeSpan.FromMinutes(1),
                        PermitLimit = 120,
                        QueueLimit = 0,
                    }));

            options.AddPolicy(AuthPolicyName, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    ResolvePartitionKey(context),
                    _ => new FixedWindowRateLimiterOptions
                    {
                        Window = TimeSpan.FromMinutes(1),
                        PermitLimit = 30,
                        QueueLimit = 0,
                    }));
        });

        return services;
    }

    private static string ResolvePartitionKey(HttpContext context) =>
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
}
