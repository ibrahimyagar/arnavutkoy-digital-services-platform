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
/// İlçelere bağlı mahallelerin listelenmesi ve yönetimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/neighborhoods")]
public sealed class NeighborhoodsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Mahalleleri, isteğe bağlı olarak ilçeye göre filtrelenmiş biçimde listeler.
    /// </summary>
    /// <param name="districtId">Belirtilirse, yalnızca bu ilçeye bağlı mahalleler döndürülür.</param>
    /// <param name="cancellationToken">İptal jetonu.</param>
    /// <response code="200">Mahalle listesi döndürülür.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetNeighborhoods([FromQuery] Guid? districtId, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetNeighborhoodsQuery(districtId), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Belirtilen ilçeye bağlı yeni bir mahalle oluşturur.
    /// </summary>
    /// <response code="201">Mahalle oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu veya ilçe bulunamadı.</response>
    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateNeighborhood(
        [FromBody] CreateNeighborhoodRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateNeighborhoodCommand(
            request.DistrictId,
            request.Name,
            request.HeadmanFullName,
            request.HeadmanPhoneNumber,
            request.Population);

        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/neighborhoods/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}
