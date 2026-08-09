using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Infrastructure.Services;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Services;

/// <summary>
/// <see cref="JwtTokenGenerator"/>'ın, kullanıcı kimliğini/rollerini doğru claim'lere eşleyen
/// geçerli bir JWT ürettiğini ve her çağrıda benzersiz bir yenileme token'ı oluşturduğunu doğrular.
/// </summary>
public sealed class JwtTokenGeneratorTests
{
    private static JwtTokenGenerator CreateGenerator() => new(Options.Create(new JwtOptions
    {
        Issuer = "arnavutkoy-test",
        Audience = "arnavutkoy-test-audience",
        AccessTokenLifetimeMinutes = 15,
        SigningKey = "bu-cok-gizli-bir-test-anahtaridir-en-az-32-karakter",
    }));

    [Fact]
    public void GenerateAccessToken_ShouldProduceTokenWithExpectedClaims()
    {
        var generator = CreateGenerator();
        var userId = Guid.NewGuid();

        var token = generator.GenerateAccessToken(userId, "Ahmet Yılmaz", ["Citizen", "Administrator"]);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.Issuer.Should().Be("arnavutkoy-test");
        jwt.Audiences.Should().Contain("arnavutkoy-test-audience");
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.NameIdentifier && c.Value == userId.ToString());
        jwt.Claims.Should().Contain(c => c.Type == ClaimTypes.Name && c.Value == "Ahmet Yılmaz");
        jwt.Claims.Where(c => c.Type == ClaimTypes.Role).Select(c => c.Value)
            .Should().BeEquivalentTo(["Citizen", "Administrator"]);
    }

    [Fact]
    public void GenerateAccessToken_ShouldSetExpirationBasedOnConfiguredLifetime()
    {
        var generator = CreateGenerator();

        var token = generator.GenerateAccessToken(Guid.NewGuid(), "Test Kullanıcı", []);

        var jwt = new JwtSecurityTokenHandler().ReadJwtToken(token);
        jwt.ValidTo.Should().BeCloseTo(DateTime.UtcNow.AddMinutes(15), TimeSpan.FromMinutes(1));
    }

    [Fact]
    public void GenerateAccessToken_CalledTwice_ShouldProduceDifferentTokens()
    {
        var generator = CreateGenerator();
        var userId = Guid.NewGuid();

        var first = generator.GenerateAccessToken(userId, "Ahmet Yılmaz", ["Citizen"]);
        var second = generator.GenerateAccessToken(userId, "Ahmet Yılmaz", ["Citizen"]);

        first.Should().NotBe(second, "her token, benzersiz bir 'jti' claim'i içermelidir.");
    }

    [Fact]
    public void GenerateRefreshToken_ShouldProduceCryptographicallyRandomAndUniqueValues()
    {
        var generator = CreateGenerator();

        var first = generator.GenerateRefreshToken();
        var second = generator.GenerateRefreshToken();

        first.Should().NotBe(second);
        Convert.FromBase64String(first).Length.Should().Be(64);
    }
}
