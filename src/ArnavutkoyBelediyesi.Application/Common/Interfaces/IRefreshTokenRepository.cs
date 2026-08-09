namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Yenileme (refresh) token'larının saklanmasını ve rotasyonunu soyutlar. Token'ların ham değeri
/// asla saklanmaz; yalnızca SHA-256 hash'i tutulur (referans projedeki "şifrenin düz metin cookie'de
/// saklanması" güvenlik açığının bu projedeki karşılığı için alınan önlem).
/// </summary>
public interface IRefreshTokenRepository
{
    /// <summary>
    /// Yeni bir yenileme token'ı kaydı ekler.
    /// </summary>
    Task AddAsync(Guid userId, string tokenHash, DateTime expiresAtUtc, CancellationToken cancellationToken = default);

    /// <summary>
    /// Verilen hash değerine sahip, iptal edilmemiş ve süresi geçmemiş bir token'ı arar.
    /// </summary>
    Task<RefreshTokenLookup?> FindActiveAsync(string tokenHash, CancellationToken cancellationToken = default);

    /// <summary>
    /// Bir yenileme token'ını iptal eder (rotasyon veya çıkış işlemi sırasında kullanılır).
    /// </summary>
    Task RevokeAsync(string tokenHash, CancellationToken cancellationToken = default);
}

/// <summary>
/// Bir yenileme token'ı sorgusunun sonucunu taşıyan salt okunur veri kaydı.
/// </summary>
public sealed record RefreshTokenLookup(Guid Id, Guid UserId, DateTime ExpiresAtUtc, bool IsRevoked);
