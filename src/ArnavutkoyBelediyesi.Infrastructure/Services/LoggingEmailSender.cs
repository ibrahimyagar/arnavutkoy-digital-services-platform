using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

/// <summary>
/// SMTP yapılandırılmadığında e-postayı yalnızca loglar (kod gövdesi logda görülebilir; API yanıtında asla yok).
/// </summary>
public sealed class LoggingEmailSender(ILogger<LoggingEmailSender> logger) : IEmailSender
{
    public Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation(
            "E-posta simülasyonu. To={To}, Subject={Subject}, BodyLength={Length}",
            toEmail,
            subject,
            htmlBody.Length);

        // Dev kolaylığı: doğrulama kodunu logda çıkar (yalnızca LoggingEmailSender).
        var codeMatch = System.Text.RegularExpressions.Regex.Match(
            htmlBody,
            @"letter-spacing:8px[^>]*>(\d{6})<");
        if (codeMatch.Success)
        {
            logger.LogInformation("Doğrulama kodu (yalnızca log): {Code} → {To}", codeMatch.Groups[1].Value, toEmail);
        }

        return Task.CompletedTask;
    }
}
