namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

public sealed record RegisterRequest(
    string Email,
    string FullName,
    string PhoneNumber,
    string NationalId,
    DateOnly BirthDate,
    string Gender,
    string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record RefreshTokenRequest(string RefreshToken);

public sealed record LogoutRequest(string RefreshToken);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);

public sealed record UpdatePhoneRequest(string PhoneNumber);
