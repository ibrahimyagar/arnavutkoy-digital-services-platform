using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Identity;

namespace ArnavutkoyBelediyesi.Application.Features.Auth;

/// <summary>
/// Doğrulama kodu üretimi, e-posta gönderimi ve önceki kodları geçersiz kılma.
/// </summary>
public sealed class EmailVerificationIssuer(
    IUnitOfWork unitOfWork,
    IEmailSender emailSender,
    IDateTimeProvider dateTimeProvider) : IEmailVerificationIssuer
{
    public async Task IssueAndSendAsync(
        Guid userId,
        string email,
        string fullName,
        CancellationToken cancellationToken)
    {
        var now = dateTimeProvider.UtcNow;
        var activeCodes = unitOfWork.Repository<EmailVerificationCode>()
            .Query()
            .Where(c => c.UserId == userId && c.ConsumedAtUtc == null)
            .ToList();

        foreach (var previous in activeCodes)
        {
            previous.Invalidate(now);
            unitOfWork.Repository<EmailVerificationCode>().Update(previous);
        }

        var plainCode = EmailVerificationCode.GenerateNumericCode();
        var hash = EmailVerificationCode.HashCode(userId, plainCode);
        var entity = EmailVerificationCode.Create(
            userId,
            hash,
            now.Add(EmailVerificationCode.DefaultLifetimeToLive));

        await unitOfWork.Repository<EmailVerificationCode>()
            .AddAsync(entity, cancellationToken)
            .ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        var html = EmailVerificationMailTemplate.BuildHtml(fullName, plainCode);
        await emailSender
            .SendAsync(email, "E-posta doğrulama kodunuz", html, cancellationToken)
            .ConfigureAwait(false);
    }

    public Task<bool> CanResendAsync(Guid userId, CancellationToken cancellationToken)
    {
        _ = cancellationToken;
        var now = dateTimeProvider.UtcNow;
        var latest = unitOfWork.Repository<EmailVerificationCode>()
            .Query()
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.CreatedAtUtc)
            .FirstOrDefault();

        if (latest is null)
        {
            return Task.FromResult(true);
        }

        return Task.FromResult(now - latest.CreatedAtUtc >= EmailVerificationCode.ResendCooldown);
    }
}
