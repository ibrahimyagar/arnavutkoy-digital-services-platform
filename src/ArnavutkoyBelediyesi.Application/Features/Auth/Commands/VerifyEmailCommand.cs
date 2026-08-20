using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Identity;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

public sealed record VerifyEmailCommand(string Email, string Code) : IRequest<Result>;

public sealed class VerifyEmailCommandValidator : AbstractValidator<VerifyEmailCommand>
{
    public VerifyEmailCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(email => !string.IsNullOrWhiteSpace(email))
            .WithMessage("E-posta zorunludur.")
            .Must(EmailNormalizer.IsValid)
            .WithMessage("Geçerli bir e-posta girilmelidir.");

        RuleFor(x => x.Code)
            .Cascade(CascadeMode.Stop)
            .NotEmpty()
            .Length(EmailVerificationCode.CodeLength)
            .Matches(@"^\d{6}$")
            .WithMessage("Doğrulama kodu 6 haneli olmalıdır.");
    }
}

public sealed class VerifyEmailCommandHandler(
    IIdentityService identityService,
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider)
    : IRequestHandler<VerifyEmailCommand, Result>
{
    public async Task<Result> Handle(VerifyEmailCommand request, CancellationToken cancellationToken)
    {
        var account = await identityService.FindByEmailAsync(request.Email, cancellationToken).ConfigureAwait(false);
        if (account is null)
        {
            return Result.Failure(EmailVerificationMessages.InvalidOrExpiredCode);
        }

        if (account.EmailConfirmed)
        {
            return Result.Success();
        }

        var now = dateTimeProvider.UtcNow;
        var active = unitOfWork.Repository<EmailVerificationCode>()
            .Query()
            .Where(c => c.UserId == account.UserId && c.ConsumedAtUtc == null)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefault();

        if (active is null || !active.IsActive(now))
        {
            return Result.Failure(EmailVerificationMessages.InvalidOrExpiredCode);
        }

        if (!EmailVerificationCode.CodesMatch(active.CodeHash, account.UserId, request.Code))
        {
            active.RecordFailedAttempt();
            unitOfWork.Repository<EmailVerificationCode>().Update(active);
            await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
            return Result.Failure(EmailVerificationMessages.InvalidOrExpiredCode);
        }

        active.MarkConsumed(now);
        unitOfWork.Repository<EmailVerificationCode>().Update(active);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return await identityService.ConfirmEmailAsync(account.UserId, cancellationToken).ConfigureAwait(false);
    }
}
