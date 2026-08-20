using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Common;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

public sealed record ResendVerificationCodeCommand(string Email) : IRequest<Result>;

public sealed class ResendVerificationCodeCommandValidator : AbstractValidator<ResendVerificationCodeCommand>
{
    public ResendVerificationCodeCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(email => !string.IsNullOrWhiteSpace(email))
            .WithMessage("E-posta zorunludur.")
            .Must(EmailNormalizer.IsValid)
            .WithMessage("Geçerli bir e-posta girilmelidir.");
    }
}

public sealed class ResendVerificationCodeCommandHandler(
    IIdentityService identityService,
    IEmailVerificationIssuer verificationIssuer)
    : IRequestHandler<ResendVerificationCodeCommand, Result>
{
    public async Task<Result> Handle(ResendVerificationCodeCommand request, CancellationToken cancellationToken)
    {
        var account = await identityService.FindByEmailAsync(request.Email, cancellationToken).ConfigureAwait(false);
        if (account is null)
        {
            return Result.Success();
        }

        if (account.EmailConfirmed)
        {
            return Result.Success();
        }

        if (!await verificationIssuer.CanResendAsync(account.UserId, cancellationToken).ConfigureAwait(false))
        {
            return Result.Failure(EmailVerificationMessages.ResendTooSoon);
        }

        await verificationIssuer
            .IssueAndSendAsync(account.UserId, account.Email, account.FullName, cancellationToken)
            .ConfigureAwait(false);

        return Result.Success();
    }
}
