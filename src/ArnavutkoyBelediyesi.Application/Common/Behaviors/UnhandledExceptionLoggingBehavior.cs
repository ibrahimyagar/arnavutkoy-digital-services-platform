using MediatR;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Common.Behaviors;

/// <summary>
/// Bir handler'da öngörülemeyen (domain/validasyon dışı) bir istisna oluştuğunda, isteğin tipini
/// ve içeriğini loglayıp exception'ı yeniden fırlatan MediatR pipeline davranışı. Nihai HTTP
/// yanıtına dönüştürme işi API katmanındaki global exception middleware'e aittir.
/// </summary>
public sealed class UnhandledExceptionLoggingBehavior<TRequest, TResponse>(
    ILogger<UnhandledExceptionLoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        try
        {
            return await next().ConfigureAwait(false);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "'{RequestName}' işlenirken öngörülemeyen bir hata oluştu. İstek: {@Request}",
                typeof(TRequest).Name,
                request);
            throw;
        }
    }
}
