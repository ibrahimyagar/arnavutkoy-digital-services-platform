namespace ArnavutkoyBelediyesi.Persistence.Identity;

/// <summary>
/// Bir kullanıcıya ait yenileme (refresh) token'ının kalıcı kaydı. Token'ın ham değeri hiçbir
/// zaman saklanmaz; yalnızca SHA-256 hash'i tutulur. Referans projedeki "beni hatırla" özelliğinin
/// düz metin şifreyi cookie'de saklayan güvenlik açığına karşı alınan önlemdir (bkz. ARCHITECTURE.md).
/// </summary>
public sealed class RefreshToken
{
    private RefreshToken()
    {
        TokenHash = string.Empty;
    }

    public RefreshToken(Guid userId, string tokenHash, DateTime expiresAtUtc)
    {
        Id = Guid.NewGuid();
        UserId = userId;
        TokenHash = tokenHash;
        ExpiresAtUtc = expiresAtUtc;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public string TokenHash { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public DateTime CreatedAtUtc { get; private set; }

    public bool IsRevoked { get; private set; }

    /// <summary>
    /// Token'ı iptal eder (rotasyon veya çıkış işlemi sırasında çağrılır).
    /// </summary>
    public void Revoke() => IsRevoked = true;
}
