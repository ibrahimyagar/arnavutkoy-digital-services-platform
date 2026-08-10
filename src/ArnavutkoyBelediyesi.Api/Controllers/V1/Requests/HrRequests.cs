namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

public sealed record CreateDepartmentRequest(string Name, string? Description);

public sealed record CreateStaffMemberRequest(
    Guid DepartmentId,
    string FullName,
    string Title,
    string? Email,
    string? PhoneNumber);
