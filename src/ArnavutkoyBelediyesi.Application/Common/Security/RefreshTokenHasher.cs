using System.Security.Cryptography;
using System.Text;

namespace ArnavutkoyBelediyesi.Application.Common.Security;

/// <summary>
/// Yenileme (refresh) token'larının ham değerini, kalıcı depoya yazılmadan önce tek yönlü olarak
/// hash'ler. Ham token yalnızca istemciye döner; veritabanında asla saklanmaz.
/// </summary>
internal static class RefreshTokenHasher
{
    public static string Hash(string rawToken) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));
}
