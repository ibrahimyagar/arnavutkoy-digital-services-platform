using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Features.Geography.Commands;
using ArnavutkoyBelediyesi.Application.Features.Geography.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Mahallelere bağlı sokakların listelenmesi ve yönetimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/streets")]
public sealed class StreetsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Sokakları, isteğe bağlı olarak mahalleye göre filtrelenmiş biçimde listeler.
    /// </summary>
    /// <param name="neighborhoodId">Belirtilirse, yalnızca bu mahalleye bağlı sokaklar döndürülür.</param>
    /// <param name="cancellationToken">İptal jetonu.</param>
    /// <response code="200">Sokak listesi döndürülür.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStreets([FromQuery] Guid? neighborhoodId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStreetsQuery(neighborhoodId), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirtilen mahalleye bağlı yeni bir sokak oluşturur.
    /// </summary>
    /// <response code="201">Sokak oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu veya mahalle bulunamadı.</response>
    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStreet(
        [FromBody] CreateStreetRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateStreetCommand(request.NeighborhoodId, request.Name);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/streets/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}
