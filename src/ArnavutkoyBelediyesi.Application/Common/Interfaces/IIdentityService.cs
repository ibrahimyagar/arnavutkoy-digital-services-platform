using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<Result<Guid>> CreateCitizenAsync(
        string email,
        string fullName,
        string phoneNumber,
        string? nationalId,
        DateOnly? birthDate,
        string gender,
        string password,
        CancellationToken cancellationToken = default);

    Task<Result<AuthenticatedUser>> ValidateCredentialsAsync(
        string email,
        string password,
        CancellationToken cancellationToken = default);

    Task<Result> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default);

    Task<Result<AuthenticatedUser>> GetUserAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Result<UserProfileDto>> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<Result> UpdatePhoneNumberAsync(Guid userId, string phoneNumber, CancellationToken cancellationToken = default);

    /// <summary>
    /// E-posta adresine göre kullanıcı kimliği ve doğrulama durumunu döner.
    /// Hesap yoksa <c>null</c>.
    /// </summary>
    Task<EmailAccountLookup?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);

    Task<Result> ConfirmEmailAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed record AuthenticatedUser(Guid UserId, string FullName, IReadOnlyCollection<string> Roles);

public sealed record EmailAccountLookup(Guid UserId, string Email, string FullName, bool EmailConfirmed);
