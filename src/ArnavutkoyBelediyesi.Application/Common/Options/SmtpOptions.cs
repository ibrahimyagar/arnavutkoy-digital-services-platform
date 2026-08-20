namespace ArnavutkoyBelediyesi.Application.Common.Options;

/// <summary>
/// SMTP e-posta gönderim ayarları. Kimlik bilgileri user-secrets / ortam değişkeninden okunur.
/// </summary>
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";

    public string Host { get; set; } = string.Empty;

    public int Port { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromAddress { get; set; } = string.Empty;

    public string FromName { get; set; } = "Arnavutköy Dijital Hizmetler";

    public bool UseSsl { get; set; } = true;

    public bool IsConfigured => !string.IsNullOrWhiteSpace(Host) && !string.IsNullOrWhiteSpace(FromAddress);
}
