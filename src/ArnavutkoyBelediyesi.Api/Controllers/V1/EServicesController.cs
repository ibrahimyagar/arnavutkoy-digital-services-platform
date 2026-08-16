using Asp.Versioning;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.EServices;
using ArnavutkoyBelediyesi.Domain.EServices;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/e-services")]
public sealed class EServicesController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    [HttpGet("sports/facilities")]
    [AllowAnonymous]
    public async Task<IActionResult> ListFacilities(CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new ListSportsFacilitiesQuery(), cancellationToken).ConfigureAwait(false));

    [HttpGet("sports/mine")]
    [Authorize]
    public async Task<IActionResult> MySports(CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new ListMySportsAppointmentsQuery(currentUserService.UserId!.Value), cancellationToken).ConfigureAwait(false));

    [HttpPost("sports/book")]
    [Authorize]
    public async Task<IActionResult> BookSports([FromBody] BookSportsRequest request, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new BookSportsAppointmentCommand(currentUserService.UserId!.Value, request.FacilityId, request.SlotStartUtc),
            cancellationToken).ConfigureAwait(false));

    [HttpGet("marriage/slots")]
    [AllowAnonymous]
    public async Task<IActionResult> MarriageSlots(CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new ListMarriageSlotsQuery(), cancellationToken).ConfigureAwait(false));

    [HttpPost("marriage/book")]
    [Authorize]
    public async Task<IActionResult> BookMarriage([FromBody] BookMarriageRequest request, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new BookMarriageCommand(currentUserService.UserId!.Value, request.SlotId, request.PartnerFullName),
            cancellationToken).ConfigureAwait(false));

    [HttpGet("documents/mine")]
    [Authorize]
    public async Task<IActionResult> MyDocuments(CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new ListMyDocumentApplicationsQuery(currentUserService.UserId!.Value), cancellationToken).ConfigureAwait(false));

    [HttpPost("documents")]
    [Authorize]
    public async Task<IActionResult> SubmitDocument([FromBody] SubmitDocumentRequest request, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new SubmitDocumentApplicationCommand(
                currentUserService.UserId!.Value,
                request.Type,
                request.Title,
                request.Description),
            cancellationToken).ConfigureAwait(false));

    [HttpGet("tracking/{code}")]
    [AllowAnonymous]
    public async Task<IActionResult> Tracking(string code, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new LookupTrackingQuery(code), cancellationToken).ConfigureAwait(false));

    [HttpPost("contact")]
    [AllowAnonymous]
    public async Task<IActionResult> Contact([FromBody] ContactRequest request, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new SubmitContactMessageCommand(
                request.FullName,
                request.Email,
                request.Subject,
                request.Body,
                request.Phone,
                string.IsNullOrWhiteSpace(request.PreferredReply) ? "Email" : request.PreferredReply,
                currentUserService.UserId),
            cancellationToken).ConfigureAwait(false));

    [HttpGet("contact/mine")]
    [Authorize]
    public async Task<IActionResult> MyContactMessages(CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new ListMyContactMessagesQuery(currentUserService.UserId!.Value),
            cancellationToken).ConfigureAwait(false));

    [HttpGet("zoning")]
    [AllowAnonymous]
    public async Task<IActionResult> Zoning([FromQuery] string ada, [FromQuery] string parsel, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(new LookupZoningQuery(ada, parsel), cancellationToken).ConfigureAwait(false));

    [HttpPost("zoning/fee")]
    [AllowAnonymous]
    public async Task<IActionResult> ZoningFee([FromBody] ZoningFeeRequest request, CancellationToken cancellationToken)
        => HandleResult(await sender.Send(
            new CalculateZoningFeeQuery(request.Ada, request.Parsel, request.RequestedAreaSqm),
            cancellationToken).ConfigureAwait(false));
}

public sealed record BookSportsRequest(Guid FacilityId, DateTime SlotStartUtc);
public sealed record BookMarriageRequest(Guid SlotId, string PartnerFullName);
public sealed record SubmitDocumentRequest(DocumentApplicationType Type, string Title, string Description);
public sealed record ContactRequest(
    string FullName,
    string Email,
    string Subject,
    string Body,
    string? Phone,
    string? PreferredReply);
public sealed record ZoningFeeRequest(string Ada, string Parsel, decimal RequestedAreaSqm);
