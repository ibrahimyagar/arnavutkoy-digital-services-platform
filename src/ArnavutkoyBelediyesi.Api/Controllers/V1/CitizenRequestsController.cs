using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Common;
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
[Authorize]
public sealed class CitizenRequestsController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
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
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
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
    /// Geçerli kullanıcıya ait talepleri sayfalı olarak listeler.
    /// </summary>
    /// <response code="200">Talep listesi döndürülür.</response>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRequests(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyCitizenRequestsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi, tüm mesaj geçmişiyle birlikte getirir. Yalnızca talep sahibi vatandaş veya
    /// Officer/Administrator rolündeki kullanıcılar erişebilir.
    /// </summary>
    /// <response code="200">Talep bulundu.</response>
    /// <response code="400">Belirtilen kimlikte bir talep bulunamadı.</response>
    /// <response code="403">Bu talebe erişim yetkiniz yok.</response>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRequestById(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCitizenRequestByIdQuery(id), cancellationToken).ConfigureAwait(false);

        if (result.IsSuccess && !IsOwnerOrStaff(result.Value.CitizenUserId))
        {
            return Forbid();
        }

        return HandleResult(result);
    }

    /// <summary>
    /// Geçerli kullanıcı adına yeni bir hizmet talebi oluşturur.
    /// </summary>
    /// <response code="201">Talep oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu ya da kategori geçersiz.</response>
    [HttpPost]
    [Authorize(Roles = Roles.Citizen)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRequest(
        [FromBody] CreateCitizenRequestRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateCitizenRequestCommand(currentUserService.UserId!.Value, request.CategoryId, request.InitialMessage);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/citizen-requests/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    /// <summary>
    /// Bir talebe, geçerli kullanıcı adına yeni bir mesaj ekler.
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
        var senderType = User.IsInRole(Roles.Officer) || User.IsInRole(Roles.Administrator)
            ? SenderType.Officer
            : SenderType.Citizen;

        var command = new AddRequestMessageCommand(id, currentUserService.UserId!.Value, senderType, request.Message);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Bir talebi inceleme sürecine alır.
    /// </summary>
    /// <response code="204">Talep durumu güncellendi.</response>
    /// <response code="400">Talep bulunamadı ya da durum geçişi geçersiz.</response>
    [HttpPost("{id:guid}/under-review")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
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
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
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
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Close(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CloseRequestCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    private bool IsOwnerOrStaff(Guid resourceOwnerUserId) =>
        currentUserService.UserId == resourceOwnerUserId
        || User.IsInRole(Roles.Officer)
        || User.IsInRole(Roles.Administrator);
}
