namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// JWT erişim token'ı ve rastgele yenileme (refresh) token'ı üretimini soyutlar.
/// </summary>
public interface IJwtTokenGenerator
{
    /// <summary>
    /// Kısa ömürlü bir JWT erişim token'ı üretir.
    /// </summary>
    string GenerateAccessToken(Guid userId, string fullName, IEnumerable<string> roles);

    /// <summary>
    /// Kriptografik olarak güvenli, rastgele bir yenileme token'ı değeri üretir.
    /// Bu değerin ham hâli yalnızca istemciye döner; veritabanında sadece hash'i saklanır.
    /// </summary>
    string GenerateRefreshToken();
}
