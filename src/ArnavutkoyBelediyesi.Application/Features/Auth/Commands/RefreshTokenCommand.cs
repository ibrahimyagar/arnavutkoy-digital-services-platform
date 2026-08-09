using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Security;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using ArnavutkoyBelediyesi.Application.Features.Auth.Services;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// Süresi dolmuş bir erişim token'ını, geçerli bir yenileme token'ı karşılığında yeniler.
/// Rotasyon ilkesiyle, kullanılan yenileme token'ı anında iptal edilip yerine yenisi verilir;
/// böylece çalınmış bir token'ın tekrar tekrar kullanılması (replay) engellenir.
/// </summary>
public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<Result<AuthResultDto>>;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public sealed class RefreshTokenCommandHandler(
    IRefreshTokenRepository refreshTokenRepository,
    IIdentityService identityService,
    IDateTimeProvider dateTimeProvider,
    AuthTokenIssuer tokenIssuer) : IRequestHandler<RefreshTokenCommand, Result<AuthResultDto>>
{
    public async Task<Result<AuthResultDto>> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        var tokenHash = RefreshTokenHasher.Hash(request.RefreshToken);

        var lookup = await refreshTokenRepository.FindActiveAsync(tokenHash, cancellationToken).ConfigureAwait(false);

        if (lookup is null || lookup.IsRevoked || lookup.ExpiresAtUtc <= dateTimeProvider.UtcNow)
        {
            return Result<AuthResultDto>.Failure("Yenileme token'ı geçersiz veya süresi dolmuş.");
        }

        await refreshTokenRepository.RevokeAsync(tokenHash, cancellationToken).ConfigureAwait(false);

        var userResult = await identityService.GetUserAsync(lookup.UserId, cancellationToken).ConfigureAwait(false);
        if (!userResult.IsSuccess)
        {
            return Result<AuthResultDto>.Failure(userResult.Errors);
        }

        var dto = await tokenIssuer.IssueAsync(userResult.Value, cancellationToken).ConfigureAwait(false);
        return Result<AuthResultDto>.Success(dto);
    }
}
