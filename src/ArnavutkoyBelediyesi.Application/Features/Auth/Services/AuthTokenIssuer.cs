using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Common.Security;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Services;

/// <summary>
/// Kimliği doğrulanmış bir kullanıcı için JWT erişim token'ı ve yenileme token'ı çiftini üretir,
/// yenileme token'ının hash'ini kalıcı hâle getirir. <see cref="Commands.LoginCommandHandler"/> ve
/// <see cref="Commands.RefreshTokenCommandHandler"/> arasındaki ortak mantığı tekrarsız (DRY) tutar.
/// </summary>
public sealed class AuthTokenIssuer(
    IJwtTokenGenerator jwtTokenGenerator,
    IRefreshTokenRepository refreshTokenRepository,
    IDateTimeProvider dateTimeProvider,
    IOptions<JwtOptions> jwtOptions)
{
    public async Task<AuthResultDto> IssueAsync(AuthenticatedUser user, CancellationToken cancellationToken)
    {
        var options = jwtOptions.Value;
        var now = dateTimeProvider.UtcNow;

        var accessToken = jwtTokenGenerator.GenerateAccessToken(user.UserId, user.FullName, user.Roles);
        var accessTokenExpiresAtUtc = now.AddMinutes(options.AccessTokenLifetimeMinutes);

        var refreshToken = jwtTokenGenerator.GenerateRefreshToken();
        var refreshTokenExpiresAtUtc = now.AddDays(options.RefreshTokenLifetimeDays);

        await refreshTokenRepository
            .AddAsync(user.UserId, RefreshTokenHasher.Hash(refreshToken), refreshTokenExpiresAtUtc, cancellationToken)
            .ConfigureAwait(false);

        return new AuthResultDto(
            user.UserId,
            user.FullName,
            user.Roles,
            accessToken,
            accessTokenExpiresAtUtc,
            refreshToken,
            refreshTokenExpiresAtUtc);
    }
}
