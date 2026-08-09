namespace ArnavutkoyBelediyesi.Application.Common.Options;

/// <summary>
/// JWT erişim ve yenileme token'larının üretimi/doğrulanması için gerekli yapılandırma değerleri.
/// <see cref="SigningKey"/> asla <c>appsettings.json</c> içine yazılmaz; dev'de <c>dotnet user-secrets</c>,
/// prod'da ortam değişkeni ile sağlanır (bkz. docs/DEPLOYMENT.md).
/// </summary>
public sealed class JwtOptions
{
    /// <summary>
    /// Yapılandırma dosyasındaki bölüm adı.
    /// </summary>
    public const string SectionName = "Jwt";

    /// <summary>
    /// Token'ı üreten servis (issuer).
    /// </summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>
    /// Token'ın hedeflendiği alıcı (audience).
    /// </summary>
    public string Audience { get; set; } = string.Empty;

    /// <summary>
    /// Erişim token'ının dakika cinsinden geçerlilik süresi.
    /// </summary>
    public int AccessTokenLifetimeMinutes { get; set; } = 15;

    /// <summary>
    /// Yenileme token'ının gün cinsinden geçerlilik süresi.
    /// </summary>
    public int RefreshTokenLifetimeDays { get; set; } = 7;

    /// <summary>
    /// HMAC-SHA256 imzalama için kullanılan, en az 256 bit (32 karakter) uzunluğunda gizli anahtar.
    /// </summary>
    public string SigningKey { get; set; } = string.Empty;
}
