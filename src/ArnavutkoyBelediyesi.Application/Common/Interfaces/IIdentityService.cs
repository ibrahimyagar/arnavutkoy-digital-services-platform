using ArnavutkoyBelediyesi.Application.Common.Models;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Kullanıcı hesabı oluşturma ve kimlik bilgisi doğrulama işlemlerini soyutlar.
/// Implementasyonu Infrastructure katmanında ASP.NET Core Identity (<c>UserManager</c>/<c>SignInManager</c>)
/// üzerinden yapılır; Application katmanı Identity paketine doğrudan bağımlı değildir.
/// </summary>
public interface IIdentityService
{
    /// <summary>
    /// Vatandaş rolünde yeni bir kullanıcı hesabı oluşturur.
    /// </summary>
    /// <param name="nationalId">T.C. Kimlik Numarası (giriş kullanıcı adı olarak kullanılır).</param>
    /// <param name="fullName">Ad soyad.</param>
    /// <param name="phoneNumber">Telefon numarası.</param>
    /// <param name="password">Düz metin parola; Identity tarafından güvenli şekilde hash'lenir.</param>
    Task<Result<Guid>> CreateCitizenAsync(
        string nationalId,
        string fullName,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Kullanıcı adı (T.C. Kimlik No) ve parolayı doğrular, başarılıysa kullanıcı kimliğini ve rollerini döner.
    /// </summary>
    Task<Result<AuthenticatedUser>> ValidateCredentialsAsync(
        string nationalId,
        string password,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Mevcut parolayı doğrulayıp yeni parolayla değiştirir. Referans projedeki "eski şifre
    /// kontrolü olmadan şifre değiştirme" güvenlik açığının düzeltilmiş hâlidir.
    /// </summary>
    Task<Result> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default);
}

/// <summary>
/// Kimlik doğrulaması tamamlanmış bir kullanıcının temel bilgilerini taşır.
/// </summary>
public sealed record AuthenticatedUser(Guid UserId, string FullName, IReadOnlyCollection<string> Roles);
