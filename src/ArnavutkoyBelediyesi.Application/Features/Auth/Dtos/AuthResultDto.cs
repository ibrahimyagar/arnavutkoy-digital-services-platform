namespace ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

/// <summary>
/// Başarılı bir giriş veya token yenileme işleminin API'ye sunulan sonucu.
/// </summary>
public sealed record AuthResultDto(
    Guid UserId,
    string FullName,
    IReadOnlyCollection<string> Roles,
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc);
