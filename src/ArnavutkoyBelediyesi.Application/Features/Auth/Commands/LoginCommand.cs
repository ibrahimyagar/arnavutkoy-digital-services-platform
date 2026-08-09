using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using ArnavutkoyBelediyesi.Application.Features.Auth.Services;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// T.C. Kimlik Numarası ve parola ile giriş yapar; başarılıysa bir JWT erişim token'ı ve
/// yenileme token'ı çifti üretir. Hesap, art arda başarısız denemeler sonrası Identity'nin
/// kilitleme (lockout) mekanizmasıyla geçici olarak kilitlenir (bkz. Persistence katmanı).
/// </summary>
public sealed record LoginCommand(string NationalId, string Password) : IRequest<Result<AuthResultDto>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.NationalId).NotEmpty();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler(IIdentityService identityService, AuthTokenIssuer tokenIssuer)
    : IRequestHandler<LoginCommand, Result<AuthResultDto>>
{
    public async Task<Result<AuthResultDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var credentialsResult = await identityService
            .ValidateCredentialsAsync(request.NationalId, request.Password, cancellationToken)
            .ConfigureAwait(false);

        if (!credentialsResult.IsSuccess)
        {
            return Result<AuthResultDto>.Failure(credentialsResult.Errors);
        }

        var dto = await tokenIssuer.IssueAsync(credentialsResult.Value, cancellationToken).ConfigureAwait(false);
        return Result<AuthResultDto>.Success(dto);
    }
}
