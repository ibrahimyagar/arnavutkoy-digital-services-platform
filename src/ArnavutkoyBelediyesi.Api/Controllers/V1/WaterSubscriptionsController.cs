using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Commands;
using ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Su abonelikleri ve aboneliğe bağlı su borcu üretimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/water-subscriptions")]
[Authorize]
public sealed class WaterSubscriptionsController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    [HttpGet]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? subscriberUserId,
        [FromQuery] WaterSubscriptionStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetAllWaterSubscriptionsQuery(subscriberUserId, status, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyWaterSubscriptionsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetWaterSubscriptionByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (result.IsSuccess && !IsOwnerOrStaff(result.Value.SubscriberUserId))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Citizen)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Open(
        [FromBody] OpenWaterSubscriptionRequest request,
        CancellationToken cancellationToken)
    {
        var command = new OpenWaterSubscriptionCommand(
            currentUserService.UserId!.Value,
            request.NeighborhoodId,
            request.PropertyId,
            request.SubscriptionNumber);

        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);
        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/water-subscriptions/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpPost("{id:guid}/suspend")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new SuspendWaterSubscriptionCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/reactivate")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ReactivateWaterSubscriptionCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/close")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CloseWaterSubscriptionCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Aktif abonelik için su borcu oluşturur; borç <c>/debts</c> üzerinden ödenir.
    /// </summary>
    [HttpPost("{id:guid}/debts")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateDebt(
        Guid id,
        [FromBody] CreateWaterDebtRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new CreateWaterDebtForSubscriptionCommand(id, request.PrincipalAmount, request.DueDateUtc), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/debts/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    private bool IsOwnerOrStaff(Guid subscriberUserId) =>
        currentUserService.UserId == subscriberUserId
        || User.IsInRole(Roles.Officer)
        || User.IsInRole(Roles.Administrator);
}
