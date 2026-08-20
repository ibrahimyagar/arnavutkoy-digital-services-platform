using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Notifications.Commands;
using ArnavutkoyBelediyesi.Application.Features.Notifications.Queries;
using ArnavutkoyBelediyesi.Domain.Common;
using ArnavutkoyBelediyesi.Domain.Notifications;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Sistem bildirimlerinin listelenmesi ve (yönetici için) test gönderimi uç noktaları.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/notifications")]
[Authorize]
public sealed class NotificationsController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    /// <summary>
    /// Oturum açmış kullanıcının kendi bildirimlerini (ve yayın duyuru bildirimlerini) sayfalı listeler.
    /// </summary>
    /// <response code="200">Bildirim listesi döndürülür.</response>
    [HttpGet("mine")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMine(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetMyNotificationsQuery(currentUserService.UserId!.Value, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Tüm bildirim kayıtlarını filtreleyerek listeler (görevli/yönetici).
    /// </summary>
    /// <response code="200">Bildirim listesi döndürülür.</response>
    [HttpGet]
    [Authorize(Roles = Roles.OfficerOrAdministrator)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] NotificationChannel? channel,
        [FromQuery] NotificationStatus? status,
        [FromQuery] Guid? userId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var result = await sender
            .Send(new GetAllNotificationsQuery(channel, status, userId, pageNumber, pageSize), cancellationToken)
            .ConfigureAwait(false);

        return HandleResult(result);
    }

    /// <summary>
    /// Demo/geliştirme amaçlı manuel test bildirimi oluşturur.
    /// </summary>
    /// <response code="201">Bildirim kaydı oluşturuldu.</response>
    /// <response code="400">Doğrulama hatası.</response>
    [HttpPost("test")]
    [Authorize(Roles = Roles.Administrator)]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendTest(
        [FromBody] SendTestNotificationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender
            .Send(
                new SendTestNotificationCommand(request.RecipientUserId, request.Channel, request.Subject, request.Body),
                cancellationToken)
            .ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/notifications/{result.Value}", new { id = result.Value })
            : HandleResult(result);
    }
}
