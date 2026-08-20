namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// HTML e-posta gönderimini soyutlar (SMTP veya log fallback).
/// </summary>
public interface IEmailSender
{
    Task SendAsync(
        string toEmail,
        string subject,
        string htmlBody,
        CancellationToken cancellationToken = default);
}
