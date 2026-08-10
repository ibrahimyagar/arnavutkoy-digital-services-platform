using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using ArnavutkoyBelediyesi.Application.Features.Auth.Services;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// E-posta ve parola ile giriş yapar; JWT erişim ve yenileme token'ı üretir.
/// </summary>
public sealed record LoginCommand(string Email, string Password) : IRequest<Result<AuthResultDto>>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler(IIdentityService identityService, AuthTokenIssuer tokenIssuer)
    : IRequestHandler<LoginCommand, Result<AuthResultDto>>
{
    public async Task<Result<AuthResultDto>> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var credentialsResult = await identityService
            .ValidateCredentialsAsync(request.Email, request.Password, cancellationToken)
            .ConfigureAwait(false);

        if (!credentialsResult.IsSuccess)
        {
            return Result<AuthResultDto>.Failure(credentialsResult.Errors);
        }

        var dto = await tokenIssuer.IssueAsync(credentialsResult.Value, cancellationToken).ConfigureAwait(false);
        return Result<AuthResultDto>.Success(dto);
    }
}
