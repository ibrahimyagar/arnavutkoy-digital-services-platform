using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

/// <summary>
/// <see cref="IIdentityService"/>'i ASP.NET Core Identity (<see cref="UserManager{TUser}"/>) üzerinden
/// implemente eder. Art arda başarısız giriş denemeleri, Identity'nin kilitleme (lockout)
/// mekanizmasıyla otomatik olarak geçici bir hesap kilidine dönüşür (bkz. Persistence katmanı DI kaydı);
/// bu, referans projede eksik olan kaba kuvvet (brute-force) korumasının karşılığıdır.
/// </summary>
public sealed class IdentityService(UserManager<ApplicationUser> userManager) : IIdentityService
{
    public async Task<Result<Guid>> CreateCitizenAsync(
        string nationalId,
        string fullName,
        string phoneNumber,
        string password,
        CancellationToken cancellationToken = default)
    {
        var existingUser = await userManager.FindByNameAsync(nationalId).ConfigureAwait(false);
        if (existingUser is not null)
        {
            return Result<Guid>.Failure("Bu T.C. Kimlik Numarası ile zaten bir hesap bulunmaktadır.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = nationalId,
            PhoneNumber = phoneNumber,
            FullName = fullName,
            CreatedAtUtc = DateTime.UtcNow,
        };

        var createResult = await userManager.CreateAsync(user, password).ConfigureAwait(false);
        if (!createResult.Succeeded)
        {
            return Result<Guid>.Failure(createResult.Errors.Select(error => error.Description).ToArray());
        }

        var roleResult = await userManager.AddToRoleAsync(user, Roles.Citizen).ConfigureAwait(false);
        if (!roleResult.Succeeded)
        {
            return Result<Guid>.Failure(roleResult.Errors.Select(error => error.Description).ToArray());
        }

        return Result<Guid>.Success(user.Id);
    }

    public async Task<Result<AuthenticatedUser>> ValidateCredentialsAsync(
        string nationalId,
        string password,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByNameAsync(nationalId).ConfigureAwait(false);
        if (user is null)
        {
            return Result<AuthenticatedUser>.Failure("Kullanıcı adı veya parola hatalı.");
        }

        if (await userManager.IsLockedOutAsync(user).ConfigureAwait(false))
        {
            return Result<AuthenticatedUser>.Failure(
                "Çok fazla başarısız giriş denemesi nedeniyle hesabınız geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.");
        }

        var passwordValid = await userManager.CheckPasswordAsync(user, password).ConfigureAwait(false);
        if (!passwordValid)
        {
            await userManager.AccessFailedAsync(user).ConfigureAwait(false);
            return Result<AuthenticatedUser>.Failure("Kullanıcı adı veya parola hatalı.");
        }

        await userManager.ResetAccessFailedCountAsync(user).ConfigureAwait(false);

        var roles = await userManager.GetRolesAsync(user).ConfigureAwait(false);
        return Result<AuthenticatedUser>.Success(new AuthenticatedUser(user.Id, user.FullName, roles.ToArray()));
    }

    public async Task<Result> ChangePasswordAsync(
        Guid userId,
        string currentPassword,
        string newPassword,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()).ConfigureAwait(false);
        if (user is null)
        {
            return Result.Failure("Kullanıcı bulunamadı.");
        }

        var result = await userManager.ChangePasswordAsync(user, currentPassword, newPassword).ConfigureAwait(false);

        return result.Succeeded
            ? Result.Success()
            : Result.Failure(result.Errors.Select(error => error.Description).ToArray());
    }

    public async Task<Result<AuthenticatedUser>> GetUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()).ConfigureAwait(false);
        if (user is null)
        {
            return Result<AuthenticatedUser>.Failure("Kullanıcı bulunamadı.");
        }

        var roles = await userManager.GetRolesAsync(user).ConfigureAwait(false);
        return Result<AuthenticatedUser>.Success(new AuthenticatedUser(user.Id, user.FullName, roles.ToArray()));
    }
}
