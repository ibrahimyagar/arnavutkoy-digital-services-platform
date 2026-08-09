using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Persistence.Identity;

/// <summary>
/// ASP.NET Core Identity kullanıcı kaydını, platforma özgü ek alanlarla genişletir.
/// Giriş kullanıcı adı (<see cref="IdentityUser{TKey}.UserName"/>) olarak T.C. Kimlik Numarası
/// kullanılır (bkz. ASSUMPTIONS.md → A6). Bu sınıf bilinçli olarak Persistence katmanında tutulur
/// çünkü <see cref="ApplicationDbContext"/>'in jenerik tip parametresiyle doğrudan bağlıdır.
/// </summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
    /// <summary>
    /// Kullanıcının adı soyadı.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Hesabın oluşturulduğu UTC zaman.
    /// </summary>
    public DateTime CreatedAtUtc { get; set; }
}
