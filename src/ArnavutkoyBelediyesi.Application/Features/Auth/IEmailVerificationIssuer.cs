namespace ArnavutkoyBelediyesi.Application.Features.Auth;

/// <summary>
/// Doğrulama kodu üretimi ve e-posta gönderimi.
/// </summary>
public interface IEmailVerificationIssuer
{
    Task IssueAndSendAsync(Guid userId, string email, string fullName, CancellationToken cancellationToken);

    Task<bool> CanResendAsync(Guid userId, CancellationToken cancellationToken);
}
