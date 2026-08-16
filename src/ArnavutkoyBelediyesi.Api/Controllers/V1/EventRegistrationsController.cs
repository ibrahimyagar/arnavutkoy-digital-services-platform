using Asp.Versioning;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Events;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/event-registrations")]
public sealed class EventRegistrationsController(ISender sender, ICurrentUserService currentUserService)
    : ApiControllerBase
{
    [HttpGet("status/{eventId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> Status(Guid eventId, CancellationToken cancellationToken)
        => HandleResult(await sender
            .Send(new GetEventRegistrationStatusQuery(eventId, currentUserService.UserId), cancellationToken)
            .ConfigureAwait(false));

    [HttpGet("mine")]
    [Authorize]
    public async Task<IActionResult> Mine(CancellationToken cancellationToken)
        => HandleResult(await sender
            .Send(new ListMyEventRegistrationsQuery(currentUserService.UserId!.Value), cancellationToken)
            .ConfigureAwait(false));

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Register(
        [FromBody] RegisterForEventRequest request,
        CancellationToken cancellationToken)
        => HandleResult(await sender
            .Send(new RegisterForEventCommand(currentUserService.UserId!.Value, request.EventId), cancellationToken)
            .ConfigureAwait(false));

    [HttpPost("{eventId:guid}/cancel")]
    [Authorize]
    public async Task<IActionResult> Cancel(Guid eventId, CancellationToken cancellationToken)
        => HandleResult(await sender
            .Send(new CancelEventRegistrationCommand(currentUserService.UserId!.Value, eventId), cancellationToken)
            .ConfigureAwait(false));
}

public sealed record RegisterForEventRequest(Guid EventId);
