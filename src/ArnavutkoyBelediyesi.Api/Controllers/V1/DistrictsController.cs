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
/// Belediyeye bağlı ilçelerin listelenmesi ve yönetimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/districts")]
public sealed class DistrictsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Tüm ilçeleri, bağlı mahalle sayısıyla birlikte listeler.
    /// </summary>
    /// <response code="200">İlçe listesi döndürülür.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDistricts(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDistrictsQuery(), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Yeni bir ilçe oluşturur.
    /// </summary>
    /// <response code="201">İlçe oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu.</response>
    [HttpPost]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateDistrict(
        [FromBody] CreateDistrictRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateDistrictCommand(request.Name), cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/districts/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}
