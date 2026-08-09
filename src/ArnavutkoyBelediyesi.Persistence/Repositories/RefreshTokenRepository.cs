using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Persistence.Repositories;

/// <summary>
/// <see cref="IRefreshTokenRepository"/> implementasyonu.
/// </summary>
public sealed class RefreshTokenRepository(ApplicationDbContext context) : IRefreshTokenRepository
{
    public async Task AddAsync(Guid userId, string tokenHash, DateTime expiresAtUtc, CancellationToken cancellationToken = default)
    {
        var refreshToken = new RefreshToken(userId, tokenHash, expiresAtUtc);
        await context.RefreshTokens.AddAsync(refreshToken, cancellationToken).ConfigureAwait(false);
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task<RefreshTokenLookup?> FindActiveAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var token = await context.RefreshTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken)
            .ConfigureAwait(false);

        return token is null
            ? null
            : new RefreshTokenLookup(token.Id, token.UserId, token.ExpiresAtUtc, token.IsRevoked);
    }

    public async Task RevokeAsync(string tokenHash, CancellationToken cancellationToken = default)
    {
        var token = await context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash, cancellationToken)
            .ConfigureAwait(false);

        if (token is null)
        {
            return;
        }

        token.Revoke();
        await context.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }
}
