using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// Mevcut parolayı doğrulayıp yeni parolayla değiştirir. <see cref="UserId"/> istekten değil,
/// API katmanında kimliği doğrulanmış kullanıcının JWT'sinden okunur; bir kullanıcının başka
/// bir kullanıcının parolasını değiştirebilmesi mümkün değildir.
/// </summary>
public sealed record ChangePasswordCommand(Guid UserId, string CurrentPassword, string NewPassword) : IRequest<Result>;

public sealed class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.CurrentPassword).NotEmpty();

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Za-z]").WithMessage("Parola en az bir harf içermelidir.")
            .Matches(@"\d").WithMessage("Parola en az bir rakam içermelidir.");
    }
}

public sealed class ChangePasswordCommandHandler(IIdentityService identityService)
    : IRequestHandler<ChangePasswordCommand, Result>
{
    public Task<Result> Handle(ChangePasswordCommand request, CancellationToken cancellationToken) =>
        identityService.ChangePasswordAsync(request.UserId, request.CurrentPassword, request.NewPassword, cancellationToken);
}
