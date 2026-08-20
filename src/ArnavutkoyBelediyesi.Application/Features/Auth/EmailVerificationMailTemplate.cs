using System.Net;
using System.Text;

namespace ArnavutkoyBelediyesi.Application.Features.Auth;

/// <summary>
/// Doğrulama kodu e-postasının sade HTML gövdesini üretir.
/// </summary>
public static class EmailVerificationMailTemplate
{
    public static string BuildHtml(string recipientName, string code)
    {
        var safeName = WebUtility.HtmlEncode(string.IsNullOrWhiteSpace(recipientName) ? "Vatandaş" : recipientName);
        var safeCode = WebUtility.HtmlEncode(code);

        var sb = new StringBuilder();
        sb.Append("<!DOCTYPE html><html><body style=\"font-family:Segoe UI,Arial,sans-serif;color:#1a1a1a;\">");
        sb.Append("<div style=\"max-width:480px;margin:0 auto;padding:24px;\">");
        sb.Append("<h1 style=\"font-size:20px;margin:0 0 12px;\">Arnavutköy Dijital Hizmetler</h1>");
        sb.Append("<p>Merhaba ").Append(safeName).Append(",</p>");
        sb.Append("<p>Hesabınızı doğrulamak için aşağıdaki 6 haneli kodu kullanın:</p>");
        sb.Append("<p style=\"font-size:32px;letter-spacing:8px;font-weight:700;margin:24px 0;\">")
            .Append(safeCode)
            .Append("</p>");
        sb.Append("<p style=\"color:#555;\">Kod 10 dakika geçerlidir. Bu kodu kimseyle paylaşmayın.</p>");
        sb.Append("<p style=\"color:#888;font-size:12px;\">Bu bir portföy/demo platformudur; resmi belediye işlemi değildir.</p>");
        sb.Append("</div></body></html>");
        return sb.ToString();
    }
}
