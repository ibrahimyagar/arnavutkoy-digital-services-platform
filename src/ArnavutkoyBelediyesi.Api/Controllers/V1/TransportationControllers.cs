using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Transportation.Commands;
using ArnavutkoyBelediyesi.Application.Features.Transportation.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/bus-lines")]
public sealed class BusLinesController(ISender sender) : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll([FromQuery] bool activeOnly = true, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new GetBusLinesQuery(activeOnly), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetBusLineByIdQuery(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("stops/search")]
    [AllowAnonymous]
    public async Task<IActionResult> SearchStops([FromQuery] string q, [FromQuery] int limit = 20, CancellationToken cancellationToken = default)
    {
        var result = await sender.Send(new SearchBusStopsQuery(q, limit), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    public async Task<IActionResult> Create([FromBody] CreateBusLineRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateBusLineCommand(request.Code, request.Name, request.RouteSummary ?? string.Empty, request.BaseFare),
            cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/bus-lines/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpPost("{id:guid}/stops")]
    [Authorize(Roles = Roles.Administrator)]
    public async Task<IActionResult> AddStop(Guid id, [FromBody] AddBusLineStopRequest request, CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new AddBusLineStopCommand(id, request.Sequence, request.Name), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/bus-lines/{id}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpPost("{id:guid}/departures")]
    [Authorize(Roles = Roles.Administrator)]
    public async Task<IActionResult> AddDeparture(Guid id, [FromBody] AddBusLineDepartureRequest request, CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new AddBusLineDepartureCommand(id, request.DayOfWeek, request.DepartureTime, request.Note), cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/bus-lines/{id}", new { id = result.Value })
            : HandleResult(result);
    }
}

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/transport-cards")]
[Authorize]
public sealed class TransportCardsController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    [HttpGet("mine")]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new GetMyTransportCardsQuery(currentUserService.UserId!.Value), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetTransportCardByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (result.IsSuccess &&
            result.Value.OwnerUserId != currentUserService.UserId &&
            !User.IsInRole(Roles.Officer) &&
            !User.IsInRole(Roles.Administrator))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    [HttpPost]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> Issue([FromBody] IssueTransportCardRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new IssueTransportCardCommand(currentUserService.UserId!.Value, request.CardNumber, request.InitialBalance),
            cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/transport-cards/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpPost("{id:guid}/top-up")]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> TopUp(Guid id, [FromBody] TopUpTransportCardRequest request, CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetTransportCardByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.OwnerUserId != currentUserService.UserId)
        {
            return Forbid();
        }

        var result = await sender.Send(new TopUpTransportCardCommand(id, request.Amount), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/deactivate")]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetTransportCardByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.OwnerUserId != currentUserService.UserId)
        {
            return Forbid();
        }

        var result = await sender.Send(new DeactivateTransportCardCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpPost("{id:guid}/board")]
    [Authorize(Roles = Roles.Citizen)]
    public async Task<IActionResult> Board(Guid id, [FromBody] BoardBusRequest request, CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetTransportCardByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.OwnerUserId != currentUserService.UserId)
        {
            return Forbid();
        }

        var result = await sender.Send(new BoardBusCommand(id, request.BusLineId), cancellationToken).ConfigureAwait(false);
        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/transport-cards/boardings/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    [HttpGet("mine/boardings")]
    public async Task<IActionResult> GetMyBoardings(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyBoardingsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }
}
