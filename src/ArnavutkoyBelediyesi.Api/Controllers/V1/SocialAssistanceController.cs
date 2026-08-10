using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Commands;
using ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/social-assistance")]
[Authorize]
public sealed class SocialAssistanceController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    public async Task<IActionResult> GetAll(
        [FromQuery] SocialAssistanceApplicationStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetAllSocialAssistanceApplicationsQuery(status, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMySocialAssistanceApplicationsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSocialAssistanceApplicationByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (result.IsSuccess && !IsOwnerOrStaff(result.Value.ApplicantUserId))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> Submit([FromBody] SubmitSocialAssistanceRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SubmitSocialAssistanceApplicationCommand(
            currentUserService.UserId!.Value,
            request.Type,
            request.HouseholdSize,
            request.MonthlyIncome,
            request.HouseholdSummary,
            request.ExtraFieldsJson), cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/social-assistance/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpPost("{id:guid}/start-review")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    public async Task<IActionResult> StartReview(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new StartSocialAssistanceReviewCommand(id, currentUserService.UserId!.Value), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/decide")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    public async Task<IActionResult> Decide(Guid id, [FromBody] DecideSocialAssistanceRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new DecideSocialAssistanceApplicationCommand(
            id,
            currentUserService.UserId!.Value,
            request.Approve,
            request.Note), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/withdraw")]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> Withdraw(Guid id, CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetSocialAssistanceApplicationByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.ApplicantUserId != currentUserService.UserId)
        {
            return Forbid();
        }

        var result = await sender.Send(new WithdrawSocialAssistanceApplicationCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    private bool IsOwnerOrStaff(Guid applicantUserId) =>
        currentUserService.UserId == applicantUserId
        || User.IsInRole(Roles.Officer)
        || User.IsInRole(Roles.Administrator);
}
