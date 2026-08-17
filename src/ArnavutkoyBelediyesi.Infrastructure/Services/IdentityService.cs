using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Persistence.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

public sealed class IdentityService(UserManager<ApplicationUser> userManager) : IIdentityService
{
    public async Task<Result<Guid>> CreateCitizenAsync(
        string email,
        string fullName,
        string phoneNumber,
        string? nationalId,
        DateOnly? birthDate,
        string gender,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = EmailNormalizer.Normalize(email);
        var normalizedNationalId = string.IsNullOrWhiteSpace(nationalId) ? null : nationalId.Trim();
        var normalizedPhone = PhoneNumberNormalizer.Normalize(phoneNumber);
        var normalizedGender = string.IsNullOrWhiteSpace(gender) ? string.Empty : gender.Trim().ToUpperInvariant();

        var existingByEmail = await userManager.FindByEmailAsync(normalizedEmail).ConfigureAwait(false);
        if (existingByEmail is not null)
        {
            return Result<Guid>.Failure("Bu e-posta adresi ile zaten bir hesap bulunmaktadır.");
        }

        if (normalizedNationalId is not null)
        {
            var existingByNationalId = await userManager.Users
                .AnyAsync(u => u.NationalId == normalizedNationalId, cancellationToken)
                .ConfigureAwait(false);
            if (existingByNationalId)
            {
                return Result<Guid>.Failure("Bu T.C. Kimlik Numarası ile zaten bir hesap bulunmaktadır.");
            }
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = normalizedEmail,
            Email = normalizedEmail,
            PhoneNumber = normalizedPhone,
            FullName = fullName,
            NationalId = normalizedNationalId,
            BirthDate = birthDate,
            Gender = normalizedGender,
            EmailConfirmed = true,
            CreatedAtUtc = DateTime.UtcNow,
        };

        var createResult = await userManager.CreateAsync(user, password.Trim()).ConfigureAwait(false);
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
        string email,
        string password,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = EmailNormalizer.Normalize(email);
        var user = await userManager.FindByEmailAsync(normalizedEmail).ConfigureAwait(false)
            ?? await userManager.FindByNameAsync(normalizedEmail).ConfigureAwait(false);

        if (user is null)
        {
            return Result<AuthenticatedUser>.Failure("E-posta veya parola hatalı.");
        }

        if (await userManager.IsLockedOutAsync(user).ConfigureAwait(false))
        {
            return Result<AuthenticatedUser>.Failure(
                "Çok fazla başarısız giriş denemesi nedeniyle hesabınız geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.");
        }

        var passwordValid = await VerifyPasswordAsync(user, password).ConfigureAwait(false);
        if (!passwordValid)
        {
            await userManager.AccessFailedAsync(user).ConfigureAwait(false);
            return Result<AuthenticatedUser>.Failure("E-posta veya parola hatalı.");
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

        var trimmedNew = newPassword.Trim();
        var result = await userManager.ChangePasswordAsync(user, currentPassword, trimmedNew).ConfigureAwait(false);
        if (!result.Succeeded)
        {
            var trimmedCurrent = currentPassword.Trim();
            if (!string.Equals(currentPassword, trimmedCurrent, StringComparison.Ordinal) && trimmedCurrent.Length > 0)
            {
                result = await userManager.ChangePasswordAsync(user, trimmedCurrent, trimmedNew).ConfigureAwait(false);
            }
        }

        return result.Succeeded
            ? Result.Success()
            : Result.Failure(result.Errors.Select(error => error.Description).ToArray());
    }

    private async Task<bool> VerifyPasswordAsync(ApplicationUser user, string password)
    {
        if (await userManager.CheckPasswordAsync(user, password).ConfigureAwait(false))
        {
            return true;
        }

        var trimmed = password.Trim();
        return trimmed.Length > 0
            && !string.Equals(password, trimmed, StringComparison.Ordinal)
            && await userManager.CheckPasswordAsync(user, trimmed).ConfigureAwait(false);
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

    public async Task<Result<UserProfileDto>> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()).ConfigureAwait(false);
        if (user is null)
        {
            return Result<UserProfileDto>.Failure("Kullanıcı bulunamadı.");
        }

        var roles = await userManager.GetRolesAsync(user).ConfigureAwait(false);
        return Result<UserProfileDto>.Success(
            new UserProfileDto(
                user.Id,
                user.FullName,
                user.Email ?? string.Empty,
                user.NationalId,
                user.PhoneNumber ?? string.Empty,
                user.BirthDate,
                user.Gender,
                roles.ToArray(),
                user.CreatedAtUtc));
    }

    public async Task<Result> UpdatePhoneNumberAsync(
        Guid userId,
        string phoneNumber,
        CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString()).ConfigureAwait(false);
        if (user is null)
        {
            return Result.Failure("Kullanıcı bulunamadı.");
        }

        user.PhoneNumber = PhoneNumberNormalizer.Normalize(phoneNumber);
        var result = await userManager.UpdateAsync(user).ConfigureAwait(false);

        return result.Succeeded
            ? Result.Success()
            : Result.Failure(result.Errors.Select(error => error.Description).ToArray());
    }
}
