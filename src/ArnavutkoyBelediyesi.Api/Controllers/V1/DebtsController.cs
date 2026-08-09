using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Payments.Commands;
using ArnavutkoyBelediyesi.Application.Features.Payments.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Vatandaşların belediyeye olan borçlarının görüntülenmesi ve ödenmesi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/debts")]
[Authorize]
public sealed class DebtsController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    /// <summary>
    /// Geçerli kullanıcıya ait borçları, güncel gecikme faizi hesaplanmış olarak sayfalı listeler.
    /// </summary>
    /// <response code="200">Borç listesi döndürülür.</response>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDebts(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyDebtsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Kimliğine göre bir borcu, güncel gecikme faizi hesaplanmış olarak getirir. Yalnızca borç
    /// sahibi veya Officer/Administrator rolündeki kullanıcılar erişebilir.
    /// </summary>
    /// <response code="200">Borç bulundu.</response>
    /// <response code="400">Belirtilen kimlikte bir borç bulunamadı.</response>
    /// <response code="403">Bu borca erişim yetkiniz yok.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDebtById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDebtByIdQuery(id), cancellationToken).ConfigureAwait(false);

        if (result.IsSuccess && !IsOwnerOrStaff(result.Value.DebtorUserId))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    /// <summary>
    /// Bir borcu, geçerli kullanıcı adına, güncel gecikme faizi dahil toplam tutar üzerinden öder.
    /// </summary>
    /// <response code="201">Ödeme gerçekleştirildi, ödeme kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu, borç bulunamadı ya da zaten ödenmiş.</response>
    [HttpPost("{id:guid}/payments")]
    [Authorize(Roles = Roles.Citizen)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PayDebt(
        Guid id,
        [FromBody] PayDebtRequest request,
        CancellationToken cancellationToken)
    {
        var command = new PayDebtCommand(
            id,
            currentUserService.UserId!.Value,
            request.CardHolderName,
            request.CardNumber,
            request.ExpiryMonthYear,
            request.Cvv);

        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/debts/{id}", new { paymentId = result.Value })
            : HandleResult(result);
    }

    private bool IsOwnerOrStaff(Guid resourceOwnerUserId) =>
        currentUserService.UserId == resourceOwnerUserId
        || User.IsInRole(Roles.Officer)
        || User.IsInRole(Roles.Administrator);
}
