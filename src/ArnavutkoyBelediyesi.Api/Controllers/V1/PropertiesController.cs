using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Properties.Commands;
using ArnavutkoyBelediyesi.Application.Features.Properties.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Vatandaş mülk kayıtlarının listelenmesi ve yönetimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/properties")]
[Authorize]
public sealed class PropertiesController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    /// <summary>
    /// Personel için tüm mülkleri, isteğe bağlı sahip/mahalle filtresiyle sayfalı listeler.
    /// </summary>
    [HttpGet]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? ownerUserId,
        [FromQuery] Guid? neighborhoodId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetAllCitizenPropertiesQuery(ownerUserId, neighborhoodId, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Geçerli kullanıcının mülklerini listeler.
    /// </summary>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? activeOnly = true,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyCitizenPropertiesQuery(currentUserService.UserId!.Value, pageNumber, pageSize, activeOnly), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Kimliğe göre mülk getirir. Yalnızca sahip veya personel erişebilir.
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCitizenPropertyByIdQuery(id), cancellationToken).ConfigureAwait(false);

        if (result.IsSuccess && !IsOwnerOrStaff(result.Value.OwnerUserId))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    /// <summary>
    /// Geçerli vatandaş adına yeni mülk kaydı oluşturur.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Citizen)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(
        [FromBody] RegisterCitizenPropertyRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterCitizenPropertyCommand(
            currentUserService.UserId!.Value,
            request.NeighborhoodId,
            request.StreetId,
            request.Type,
            request.Title,
            request.DoorNumber,
            request.BlockParcel ?? string.Empty);

        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/properties/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    /// <summary>
    /// Mülk adresini günceller. Yalnızca sahip veya Administrator.
    /// </summary>
    [HttpPut("{id:guid}/address")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateAddress(
        Guid id,
        [FromBody] UpdateCitizenPropertyAddressRequest request,
        CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetCitizenPropertyByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.OwnerUserId != currentUserService.UserId && !User.IsInRole(Roles.Administrator))
        {
            return Forbid();
        }

        var result = await sender
            .Send(new UpdateCitizenPropertyAddressCommand(
                id,
                request.NeighborhoodId,
                request.StreetId,
                request.DoorNumber,
                request.BlockParcel ?? string.Empty), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Mülkü pasife alır. Yalnızca sahip veya Administrator.
    /// </summary>
    [HttpPost("{id:guid}/deactivate")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken cancellationToken)
    {
        var existing = await sender.Send(new GetCitizenPropertyByIdQuery(id), cancellationToken).ConfigureAwait(false);
        if (!existing.IsSuccess)
        {
            return HandleResult(existing);
        }

        if (existing.Value.OwnerUserId != currentUserService.UserId && !User.IsInRole(Roles.Administrator))
        {
            return Forbid();
        }

        var result = await sender.Send(new DeactivateCitizenPropertyCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    private bool IsOwnerOrStaff(Guid ownerUserId) =>
        currentUserService.UserId == ownerUserId
        || User.IsInRole(Roles.Officer)
        || User.IsInRole(Roles.Administrator);
}
