using System.Collections.Concurrent;
using System.Text.RegularExpressions;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

/// <summary>
/// Test ortamında gönderilen doğrulama kodunu yakalar (API yanıtına yazılmaz).
/// Anahtarlar <see cref="EmailNormalizer"/> ile saklanır (Türkçe İ/i eşleşmesi için).
/// </summary>
public sealed class CapturingEmailSender : IEmailSender
{
    private static readonly ConcurrentDictionary<string, string> CodesByEmail = new(StringComparer.Ordinal);
    private static readonly Regex CodeRegex = new(@"letter-spacing:8px[^>]*>(\d{6})<", RegexOptions.Compiled);

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        var match = CodeRegex.Match(htmlBody);
        if (match.Success)
        {
            CodesByEmail[EmailNormalizer.Normalize(toEmail)] = match.Groups[1].Value;
        }

        return Task.CompletedTask;
    }

    public static bool TryGetCode(string email, out string code) =>
        CodesByEmail.TryGetValue(EmailNormalizer.Normalize(email), out code!);

    public static void Clear() => CodesByEmail.Clear();
}
