namespace ArnavutkoyBelediyesi.Application.Features.Hr.Dtos;

public sealed record DepartmentDto(Guid Id, string Name, string Description, bool IsActive);

public sealed record StaffMemberDto(
    Guid Id,
    Guid DepartmentId,
    string FullName,
    string Title,
    string Email,
    string PhoneNumber,
    bool IsActive);
