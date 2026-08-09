using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Features.Payments.Commands;
using ArnavutkoyBelediyesi.Application.Features.Payments.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Vatandaşların belediyeye olan borçlarının görüntülenmesi ve ödenmesi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/debts")]
public sealed class DebtsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Belirtilen vatandaşa ait borçları, güncel gecikme faizi hesaplanmış olarak sayfalı listeler.
    /// </summary>
    /// <remarks>
    /// <paramref name="debtorUserId"/> geçici olarak sorgu parametresi ile alınır; kimlik doğrulama
    /// (JWT) tamamlandığında bu değer istekten değil, geçerli kullanıcının kimliğinden okunacaktır.
    /// </remarks>
    /// <response code="200">Borç listesi döndürülür.</response>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyDebts(
        [FromQuery] Guid debtorUserId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyDebtsQuery(debtorUserId, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Kimliğine göre bir borcu, güncel gecikme faizi hesaplanmış olarak getirir.
    /// </summary>
    /// <response code="200">Borç bulundu.</response>
    /// <response code="400">Belirtilen kimlikte bir borç bulunamadı.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetDebtById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetDebtByIdQuery(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Bir borcu, güncel gecikme faizi dahil toplam tutar üzerinden öder.
    /// </summary>
    /// <response code="201">Ödeme gerçekleştirildi, ödeme kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu, borç bulunamadı ya da zaten ödenmiş.</response>
    [HttpPost("{id:guid}/payments")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PayDebt(
        Guid id,
        [FromBody] PayDebtRequest request,
        CancellationToken cancellationToken)
    {
        var command = new PayDebtCommand(
            id,
            request.PayerUserId,
            request.CardHolderName,
            request.CardNumber,
            request.ExpiryMonthYear,
            request.Cvv);

        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/debts/{id}", new { paymentId = result.Value })
            : HandleResult(result);
    }
}
