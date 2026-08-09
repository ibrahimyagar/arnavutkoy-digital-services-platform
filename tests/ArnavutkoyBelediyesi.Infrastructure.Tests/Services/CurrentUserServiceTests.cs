using System.Security.Claims;
using ArnavutkoyBelediyesi.Infrastructure.Services;
using Microsoft.AspNetCore.Http;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Services;

/// <summary>
/// <see cref="CurrentUserService"/>'in geçerli HTTP isteğinin JWT claim'lerini doğru şekilde
/// okuduğunu; kimliği doğrulanmamış isteklerde güvenli varsayılanlar döndürdüğünü doğrular.
/// </summary>
public sealed class CurrentUserServiceTests
{
    private static IHttpContextAccessor CreateAccessor(ClaimsPrincipal? user)
    {
        var accessor = Substitute.For<IHttpContextAccessor>();

        if (user is null)
        {
            accessor.HttpContext.Returns((HttpContext?)null);
            return accessor;
        }

        var httpContext = new DefaultHttpContext { User = user };
        accessor.HttpContext.Returns(httpContext);
        return accessor;
    }

    [Fact]
    public void UserId_WhenAuthenticatedWithValidGuidClaim_ShouldReturnUserId()
    {
        var userId = Guid.NewGuid();
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, userId.ToString())],
            authenticationType: "TestAuth");
        var accessor = CreateAccessor(new ClaimsPrincipal(identity));
        var service = new CurrentUserService(accessor);

        service.UserId.Should().Be(userId);
        service.IsAuthenticated.Should().BeTrue();
    }

    [Fact]
    public void UserId_WhenNoHttpContext_ShouldReturnNullAndNotThrow()
    {
        var accessor = CreateAccessor(null);
        var service = new CurrentUserService(accessor);

        service.UserId.Should().BeNull();
        service.IsAuthenticated.Should().BeFalse();
        service.Roles.Should().BeEmpty();
    }

    [Fact]
    public void UserId_WhenClaimIsNotAValidGuid_ShouldReturnNull()
    {
        var identity = new ClaimsIdentity(
            [new Claim(ClaimTypes.NameIdentifier, "not-a-guid")],
            authenticationType: "TestAuth");
        var accessor = CreateAccessor(new ClaimsPrincipal(identity));
        var service = new CurrentUserService(accessor);

        service.UserId.Should().BeNull();
    }

    [Fact]
    public void Roles_ShouldReturnAllRoleClaims()
    {
        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.Role, "Citizen"),
                new Claim(ClaimTypes.Role, "Administrator"),
            ],
            authenticationType: "TestAuth");
        var accessor = CreateAccessor(new ClaimsPrincipal(identity));
        var service = new CurrentUserService(accessor);

        service.Roles.Should().BeEquivalentTo(["Citizen", "Administrator"]);
    }

    [Fact]
    public void IsAuthenticated_WhenAnonymousIdentity_ShouldReturnFalse()
    {
        var accessor = CreateAccessor(new ClaimsPrincipal(new ClaimsIdentity()));
        var service = new CurrentUserService(accessor);

        service.IsAuthenticated.Should().BeFalse();
    }
}
