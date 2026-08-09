using ArnavutkoyBelediyesi.Application.Common.Models;
using Microsoft.AspNetCore.Mvc;

namespace ArnavutkoyBelediyesi.Api.Controllers;

/// <summary>
/// Tüm API controller'ları için, Application katmanının <see cref="Result"/>/<see cref="Result{T}"/>
/// dönüş tiplerini tutarlı HTTP yanıtlarına (RFC 7807 <c>ProblemDetails</c> dahil) çeviren taban sınıf.
/// Controller'lar iş mantığı içermez; yalnızca MediatR'a delege eder ve sonucu bu yardımcılarla dönüştürür.
/// </summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>
    /// Değer taşımayan bir <see cref="Result"/>'ı HTTP yanıtına çevirir.
    /// </summary>
    protected IActionResult HandleResult(Result result) =>
        result.IsSuccess ? NoContent() : BuildFailureResponse(result.Errors);

    /// <summary>
    /// Değer taşıyan bir <see cref="Result{T}"/>'ı HTTP yanıtına çevirir.
    /// </summary>
    protected IActionResult HandleResult<T>(Result<T> result) =>
        result.IsSuccess ? Ok(result.Value) : BuildFailureResponse(result.Errors);

    private ObjectResult BuildFailureResponse(IReadOnlyCollection<string> errors) =>
        Problem(
            title: "İstek işlenemedi.",
            detail: string.Join(" ", errors),
            statusCode: StatusCodes.Status400BadRequest);
}
