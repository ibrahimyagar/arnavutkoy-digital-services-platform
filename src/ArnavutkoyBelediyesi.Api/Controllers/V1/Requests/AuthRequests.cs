namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Vatandaş kaydı oluşturma isteği gövdesi.
/// </summary>
public sealed record RegisterRequest(string NationalId, string FullName, string PhoneNumber, string Password);

/// <summary>
/// Giriş isteği gövdesi.
/// </summary>
public sealed record LoginRequest(string NationalId, string Password);

/// <summary>
/// Erişim token'ı yenileme isteği gövdesi.
/// </summary>
public sealed record RefreshTokenRequest(string RefreshToken);

/// <summary>
/// Çıkış isteği gövdesi.
/// </summary>
public sealed record LogoutRequest(string RefreshToken);

/// <summary>
/// Parola değiştirme isteği gövdesi.
/// </summary>
public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
