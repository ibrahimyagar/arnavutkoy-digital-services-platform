using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Features.Hr.Commands;
using ArnavutkoyBelediyesi.Application.Features.Hr.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Halka açık departman ve personel dizini.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/departments")]
public sealed class DepartmentsController(ISender sender) : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDepartments([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetDepartmentsQuery(activeOnly), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentRequest request, CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new CreateDepartmentCommand(request.Name, request.Description ?? string.Empty), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/departments/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}

/// <summary>
/// Halka açık personel listesi.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/staff")]
public sealed class StaffController(ISender sender) : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStaff(
        [FromQuery] Guid? departmentId,
        [FromQuery] bool activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetStaffMembersQuery(departmentId, activeOnly), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] CreateStaffMemberRequest request, CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new CreateStaffMemberCommand(
                request.DepartmentId,
                request.FullName,
                request.Title,
                request.Email ?? string.Empty,
                request.PhoneNumber ?? string.Empty), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/staff/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}
