using System.Security.Claims;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

/// <summary>
/// <see cref="ICurrentUserService"/>'i, geçerli HTTP isteğinin <see cref="HttpContext.User"/>
/// claim'lerinden (JWT'den üretilmiş) okuyarak implemente eder.
/// </summary>
public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    public bool IsAuthenticated => httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated ?? false;

    public IReadOnlyCollection<string> Roles =>
        httpContextAccessor.HttpContext?.User.FindAll(ClaimTypes.Role).Select(claim => claim.Value).ToArray()
        ?? Array.Empty<string>();
}
