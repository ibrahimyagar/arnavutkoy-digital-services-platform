using Asp.Versioning;
using ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Auth.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1;

/// <summary>
/// Vatandaş kaydı, giriş, JWT yenileme ve parola yönetimi için kimlik doğrulama uç noktaları.
/// </summary>
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
[AllowAnonymous]
public sealed class AuthController(ISender sender, ICurrentUserService currentUserService) : ApiControllerBase
{
    /// <summary>
    /// Vatandaş rolünde yeni bir hesap oluşturur.
    /// </summary>
    /// <response code="201">Hesap oluşturuldu, kullanıcı kimliği döndürülür.</response>
    /// <response code="400">İstek doğrulaması başarısız oldu ya da kimlik numarası zaten kayıtlı.</response>
    [HttpPost("register")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        var command = new RegisterCitizenCommand(request.NationalId, request.FullName, request.PhoneNumber, request.Password);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return result.IsSuccess
            ? Created($"/api/v{HttpContext.GetRequestedApiVersion()}/auth/login", new { id = result.Value })
            : HandleResult(result);
    }

    /// <summary>
    /// T.C. Kimlik Numarası ve parola ile giriş yapar; JWT erişim ve yenileme token'ı döner.
    /// </summary>
    /// <response code="200">Giriş başarılı.</response>
    /// <response code="400">Kimlik bilgileri hatalı ya da hesap kilitli.</response>
    [HttpPost("login")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LoginCommand(request.NationalId, request.Password), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Geçerli bir yenileme token'ı karşılığında yeni bir erişim/yenileme token'ı çifti üretir.
    /// </summary>
    /// <response code="200">Token yenilendi.</response>
    /// <response code="400">Yenileme token'ı geçersiz veya süresi dolmuş.</response>
    [HttpPost("refresh")]
    [EnableRateLimiting("auth")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new RefreshTokenCommand(request.RefreshToken), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Verilen yenileme token'ını iptal eder.
    /// </summary>
    /// <response code="204">Çıkış yapıldı.</response>
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new LogoutCommand(request.RefreshToken), cancellationToken).ConfigureAwait(false);
        return HandleResult(result);
    }

    /// <summary>
    /// Kimliği doğrulanmış geçerli kullanıcının parolasını değiştirir.
    /// </summary>
    /// <response code="204">Parola değiştirildi.</response>
    /// <response code="400">Mevcut parola hatalı ya da yeni parola kurallara uymuyor.</response>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var command = new ChangePasswordCommand(currentUserService.UserId!.Value, request.CurrentPassword, request.NewPassword);
        var result = await sender.Send(command, cancellationToken).ConfigureAwait(false);

        return HandleResult(result);
    }
}
