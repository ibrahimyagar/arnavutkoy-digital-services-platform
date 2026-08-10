using Asp.Versioning;
using ArnavutkoyBelediyesi.Application.Features.Portal;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/portal")]
public sealed class PortalController(ISender sender) : ApiControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> List(
        [FromQuery] string kind,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new ListPortalContentQuery(kind, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("by-slug/{slug}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetBySlug(string slug, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPortalContentBySlugQuery(slug), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetPortalContentByIdQuery(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }
}
