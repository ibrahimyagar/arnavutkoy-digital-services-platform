using System.Security.Cryptography;
using System.Text;
using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Identity;

/// <summary>
/// E-posta doğrulama için üretilen 6 haneli kodun hash'lenmiş kaydı.
/// Düz metin kod asla saklanmaz.
/// </summary>
public sealed class EmailVerificationCode : AuditableEntity
{
    public const int CodeLength = 6;
    public const int DefaultMaxAttempts = 5;
    public static readonly TimeSpan DefaultLifetimeToLive = TimeSpan.FromMinutes(10);
    public static readonly TimeSpan ResendCooldown = TimeSpan.FromSeconds(60);

    private EmailVerificationCode()
    {
        CodeHash = string.Empty;
    }

    private EmailVerificationCode(Guid userId, string codeHash, DateTime expiresAtUtc, int maxAttempts) : this()
    {
        UserId = userId;
        CodeHash = codeHash;
        ExpiresAtUtc = expiresAtUtc;
        MaxAttempts = maxAttempts;
        AttemptCount = 0;
    }

    public Guid UserId { get; private set; }

    public string CodeHash { get; private set; }

    public DateTime ExpiresAtUtc { get; private set; }

    public int AttemptCount { get; private set; }

    public int MaxAttempts { get; private set; }

    public DateTime? ConsumedAtUtc { get; private set; }

    public bool IsConsumed => ConsumedAtUtc.HasValue;

    public static EmailVerificationCode Create(Guid userId, string codeHash, DateTime expiresAtUtc, int maxAttempts = DefaultMaxAttempts)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("Kullanıcı kimliği boş olamaz.", nameof(userId));
        }

        if (string.IsNullOrWhiteSpace(codeHash))
        {
            throw new ArgumentException("Kod hash değeri boş olamaz.", nameof(codeHash));
        }

        if (maxAttempts < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(maxAttempts));
        }

        return new EmailVerificationCode(userId, codeHash.Trim(), expiresAtUtc, maxAttempts);
    }

    public bool IsActive(DateTime nowUtc) =>
        !IsConsumed && nowUtc < ExpiresAtUtc && AttemptCount < MaxAttempts;

    public void RecordFailedAttempt()
    {
        if (IsConsumed)
        {
            return;
        }

        AttemptCount++;
    }

    public void MarkConsumed(DateTime consumedAtUtc)
    {
        if (IsConsumed)
        {
            return;
        }

        ConsumedAtUtc = consumedAtUtc;
    }

    /// <summary>
    /// Yeniden gönderimde önceki kodu geçersiz kılar.
    /// </summary>
    public void Invalidate(DateTime atUtc) => MarkConsumed(atUtc);

    /// <summary>
    /// Kriptografik olarak güvenli 6 haneli sayısal kod üretir (000000–999999).
    /// </summary>
    public static string GenerateNumericCode()
    {
        var value = RandomNumberGenerator.GetInt32(0, 1_000_000);
        return value.ToString("D6");
    }

    /// <summary>
    /// Kullanıcıya özgü SHA-256 hash üretir.
    /// </summary>
    public static string HashCode(Guid userId, string plainCode)
    {
        if (string.IsNullOrWhiteSpace(plainCode))
        {
            throw new ArgumentException("Kod boş olamaz.", nameof(plainCode));
        }

        var payload = $"{userId:N}:{plainCode.Trim()}";
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(payload));
        return Convert.ToHexString(bytes);
    }

    public static bool CodesMatch(string storedHash, Guid userId, string plainCode)
    {
        var computed = HashCode(userId, plainCode);
        var storedBytes = Convert.FromHexString(storedHash);
        var computedBytes = Convert.FromHexString(computed);
        return CryptographicOperations.FixedTimeEquals(storedBytes, computedBytes);
    }
}
