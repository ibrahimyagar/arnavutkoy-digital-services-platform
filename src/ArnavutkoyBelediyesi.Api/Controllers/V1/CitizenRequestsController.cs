using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Vatandaşların belediyeye ilettiği hizmet taleplerinin oluşturulması, takibi ve sonuçlandırılması
/// için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/citizen-requests")]
public sealed class CitizenRequestsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Talep oluştururken seçilebilecek aktif kategorileri listeler.
    /// </summary>
    /// <response code="200">Kategori listesi döndürülür.</response>
    [HttpGet("categories")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCategories(CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetRequestCategoriesQuery(), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Tüm vatandaş taleplerini, isteğe bağlı durum filtresiyle sayfalı olarak listeler.
    /// </summary>
    /// <response code="200">Talep listesi döndürülür.</response>
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllRequests(
        [FromQuery] RequestStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetAllCitizenRequestsQuery(status, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Belirtilen vatandaşa ait talepleri sayfalı olarak listeler.
    /// </summary>
    /// <remarks>
    /// <paramref name="citizenUserId"/> geçici olarak sorgu parametresi ile alınır; kimlik doğrulama
    /// (JWT) tamamlandığında bu değer istekten değil, geçerli kullanıcının kimliğinden okunacaktır.
    /// </remarks>
    /// <response code="200">Talep listesi döndürülür.</response>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] Guid citizenUserId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyCitizenRequestsQuery(citizenUserId, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi, tüm mesaj geçmişiyle birlikte getirir.
    /// </summary>
    /// <response code="200">Talep bulundu.</response>
    /// <response code="400">Belirtilen kimlikte bir talep bulunamadı.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetRequestById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCitizenRequestByIdQuery(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Vatandaş adına yeni bir hizmet talebi oluşturur.
    /// </summary>
    /// <response code="201">Talep oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu ya da kategori geçersiz.</response>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateCitizenRequestRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateCitizenRequestCommand(request.CitizenUserId, request.CategoryId, request.InitialMessage);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/citizen-requests/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    /// <summary>
    /// Bir talebe yeni bir mesaj ekler.
    /// </summary>
    /// <response code="204">Mesaj eklendi.</response>
    /// <response code="400">Talep bulunamadı ya da kapatılmış durumda.</response>
    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AddMessage(
        Guid id,
        [FromBody] AddRequestMessageRequest request,
        CancellationToken cancellationToken)
    {
        var command = new AddRequestMessageCommand(id, request.SenderUserId, request.SenderType, request.Message);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi inceleme sürecine alır.
    /// </summary>
    /// <response code="204">Talep durumu güncellendi.</response>
    /// <response code="400">Talep bulunamadı ya da durum geçişi geçersiz.</response>
    [HttpPost("{id:guid}/under-review")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> MarkUnderReview(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new MarkRequestUnderReviewCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi çözüme kavuşturur.
    /// </summary>
    /// <response code="204">Talep çözüldü.</response>
    /// <response code="400">Talep bulunamadı ya da durum geçişi geçersiz.</response>
    [HttpPost("{id:guid}/resolve")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Resolve(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ResolveRequestCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi kapatır.
    /// </summary>
    /// <response code="204">Talep kapatıldı.</response>
    /// <response code="400">Talep bulunamadı ya da durum geçişi geçersiz.</response>
    [HttpPost("{id:guid}/close")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CloseRequestCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }
}
