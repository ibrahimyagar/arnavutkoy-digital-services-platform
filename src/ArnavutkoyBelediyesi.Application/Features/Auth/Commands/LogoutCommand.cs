using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Security;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// Verilen yenileme token'ını iptal eder (çıkış işlemi). Token bulunamasa veya zaten iptal
/// edilmiş olsa da işlem başarılı kabul edilir; bu, bir saldırganın token geçerliliğini bu uç
/// nokta üzerinden sorgulayabilmesini (bilgi sızıntısı) önler.
/// </summary>
public sealed record LogoutCommand(string RefreshToken) : IRequest<Result>;

public sealed class LogoutCommandValidator : AbstractValidator<LogoutCommand>
{
    public LogoutCommandValidator()
    {
        RuleFor(x => x.RefreshToken).NotEmpty();
    }
}

public sealed class LogoutCommandHandler(IRefreshTokenRepository refreshTokenRepository)
    : IRequestHandler<LogoutCommand, Result>
{
    public async Task<Result> Handle(LogoutCommand request, CancellationToken cancellationToken)
    {
        await refreshTokenRepository
            .RevokeAsync(RefreshTokenHasher.Hash(request.RefreshToken), cancellationToken)
            .ConfigureAwait(false);

        return Result.Success();
    }
}
