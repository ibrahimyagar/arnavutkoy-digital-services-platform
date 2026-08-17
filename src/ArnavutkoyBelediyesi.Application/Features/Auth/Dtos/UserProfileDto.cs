namespace ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

public sealed record UserProfileDto(
    Guid UserId,
    string FullName,
    string Email,
    string? NationalId,
    string PhoneNumber,
    DateOnly? BirthDate,
    string Gender,
    IReadOnlyCollection<string> Roles,
    DateTime CreatedAtUtc);
