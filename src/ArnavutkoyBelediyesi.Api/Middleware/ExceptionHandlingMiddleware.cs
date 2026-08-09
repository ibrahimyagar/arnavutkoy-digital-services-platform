using System.Net;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Middleware;

/// <summary>
/// Pipeline'da yakalanmayan tüm istisnaları tutarlı bir RFC 7807 <c>ProblemDetails</c> yanıtına
/// çevirir. Teknik detaylar (stack trace, exception mesajı) yalnızca sunucu loguna yazılır;
/// istemciye asla sızdırılmaz. Bu, referans projedeki <c>mysqli_error()</c>'ün doğrudan
/// istemciye döndürülmesi güvenlik açığının (bilgi ifşası) düzeltilmiş hâlidir.
/// </summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context).ConfigureAwait(false);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "İstek işlenirken öngörülemeyen bir hata oluştu: {Path}", context.Request.Path);
            await WriteProblemResponseAsync(context).ConfigureAwait(false);
        }
    }

    private static async Task WriteProblemResponseAsync(HttpContext context)
    {
        context.Response.ContentType = "application/problem+json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var problemDetails = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "Sunucu tarafında beklenmeyen bir hata oluştu.",
            Detail = "Lütfen daha sonra tekrar deneyin. Sorun devam ederse belediye ile iletişime geçin.",
            Instance = context.Request.Path
        };

        await context.Response.WriteAsJsonAsync(problemDetails).ConfigureAwait(false);
    }
}
