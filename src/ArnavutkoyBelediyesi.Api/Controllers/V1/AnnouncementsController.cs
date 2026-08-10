using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Queries;
using ArnavutkoyBelediyesi.Domain.Announcements;
using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Belediye duyurularının yayınlanması ve yönetimi için uç noktalar.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/announcements")]
public sealed class AnnouncementsController(ISender sender) : ApiControllerBase
{
    /// <summary>
    /// Şu anda yayında olan (yayınlanmış ve süresi geçmemiş) duyuruları sayfalı olarak listeler.
    /// </summary>
    /// <response code="200">Duyuru listesi döndürülür.</response>
    [HttpGet]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPublishedAnnouncements(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetPublishedAnnouncementsQuery(pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Taslak, yayında ve arşiv duyuruları personel için sayfalı listeler.
    /// </summary>
    /// <response code="200">Yönetim listesi döndürülür.</response>
    [HttpGet("managed")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetManagedAnnouncements(
        [FromQuery] AnnouncementStatus? status,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetManagedAnnouncementsQuery(status, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Kimliğine göre bir duyurunun tam detayını getirir. Vatandaşlar ve anonim istekler
    /// yalnızca yayındaki duyuruları görebilir; taslak/arşivlenmiş duyurular Officer/Administrator
    /// rolü dışında "bulunamadı" olarak döner.
    /// </summary>
    /// <response code="200">Duyuru bulundu.</response>
    /// <response code="400">Belirtilen kimlikte bir duyuru bulunamadı.</response>
    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GetAnnouncementById(Guid id, CancellationToken cancellationToken)
    {
        var includeUnpublished = User.IsInRole(Roles.Officer) || User.IsInRole(Roles.Administrator);
        var result = await sender
            .Send(new GetAnnouncementByIdQuery(id, includeUnpublished), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Yeni bir taslak duyuru oluşturur.
    /// </summary>
    /// <response code="201">Duyuru oluşturuldu, kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu.</response>
    [HttpPost]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAnnouncement(
        [FromBody] CreateAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        var command = new CreateAnnouncementCommand(request.Title, request.Content, request.PublishEndUtc);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/announcements/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }

    /// <summary>
    /// Taslak durumundaki bir duyurunun başlık/içeriğini günceller.
    /// </summary>
    /// <response code="204">Duyuru güncellendi.</response>
    /// <response code="400">Duyuru bulunamadı ya da taslak durumunda değil.</response>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateAnnouncement(
        Guid id,
        [FromBody] UpdateAnnouncementRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(new UpdateAnnouncementCommand(id, request.Title, request.Content), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Taslak durumundaki bir duyuruyu yayına alır.
    /// </summary>
    /// <response code="204">Duyuru yayına alındı.</response>
    /// <response code="400">Duyuru bulunamadı ya da taslak durumunda değil.</response>
    [HttpPost("{id:guid}/publish")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> PublishAnnouncement(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new PublishAnnouncementCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Yayındaki bir duyuruyu arşivler.
    /// </summary>
    /// <response code="204">Duyuru arşivlendi.</response>
    /// <response code="400">Duyuru bulunamadı.</response>
    [HttpPost("{id:guid}/archive")]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ArchiveAnnouncement(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new ArchiveAnnouncementCommand(id), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }
}
