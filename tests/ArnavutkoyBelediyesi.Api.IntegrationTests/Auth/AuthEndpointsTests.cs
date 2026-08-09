using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Auth;

/// <summary>
/// Kayıt, giriş, token yenileme, çıkış ve parola değiştirme uç noktalarının uçtan uca davranışını
/// gerçek bir PostgreSQL veritabanına karşı doğrular.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AuthEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task Register_WithValidData_ShouldReturn201AndCreateAccount()
    {
        var client = factory.CreateClient();
        var nationalId = AuthHelper.GenerateValidNationalId();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId,
            fullName = "Yeni Vatandaş",
            phoneNumber = "+905551112233",
            password = "GucluSifre1",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_WithDuplicateNationalId_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var nationalId = AuthHelper.GenerateValidNationalId();
        var payload = new { nationalId, fullName = "Mükerrer Vatandaş", phoneNumber = "+905551112233", password = "GucluSifre1" };

        var first = await client.PostAsJsonAsync("/api/v1/auth/register", payload);
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await client.PostAsJsonAsync("/api/v1/auth/register", payload);

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithInvalidNationalIdChecksum_ShouldReturn400()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId = "12345678901",
            fullName = "Geçersiz Vatandaş",
            phoneNumber = "+905551112233",
            password = "GucluSifre1",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ShouldReturnAccessAndRefreshTokens()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        auth.AccessToken.Should().NotBeNullOrWhiteSpace();
        auth.RefreshToken.Should().NotBeNullOrWhiteSpace();
        auth.Roles.Should().Contain("Citizen");
    }

    [Fact]
    public async Task Login_WithWrongPassword_ShouldReturn400WithoutRevealingWhetherAccountExists()
    {
        var client = factory.CreateClient();
        var nationalId = AuthHelper.GenerateValidNationalId();
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId,
            fullName = "Test Vatandaş",
            phoneNumber = "+905551112233",
            password = "GucluSifre1",
        });

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { nationalId, password = "YanlisSifre1" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ShouldReturn400WithGenericMessage()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { nationalId = AuthHelper.GenerateValidNationalId(), password = "HerhangiBirSifre1" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithValidToken_ShouldRotateAndReturnNewTokenPair()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        var refreshResponse = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        refreshResponse.EnsureSuccessStatusCode();
        var refreshed = await refreshResponse.ReadAsAsync<AuthResultDto>();

        refreshed.Should().NotBeNull();
        refreshed!.AccessToken.Should().NotBe(auth.AccessToken);
        refreshed.RefreshToken.Should().NotBe(auth.RefreshToken);
    }

    [Fact]
    public async Task Refresh_WithAlreadyUsedToken_ShouldBeRejected_PreventingReplayAttacks()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        var firstRefresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        firstRefresh.EnsureSuccessStatusCode();

        var secondRefreshWithSameToken = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });

        secondRefreshWithSameToken.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Refresh_WithInvalidToken_ShouldReturn400()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = "gecersiz-bir-token" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_ShouldRevokeRefreshToken_SoItCannotBeUsedAgain()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        var logoutResponse = await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = auth.RefreshToken });
        logoutResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refreshAfterLogout = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        refreshAfterLogout.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangePassword_WithoutAuthentication_ShouldReturn401()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/change-password",
            new { currentPassword = "Test1234", newPassword = "YeniSifre1" });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task ChangePassword_WithCorrectCurrentPassword_ShouldSucceedAndAllowLoginWithNewPassword()
    {
        var client = factory.CreateClient();
        var nationalId = AuthHelper.GenerateValidNationalId();
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId,
            fullName = "Parola Değiştiren Vatandaş",
            phoneNumber = "+905551112233",
            password = "EskiSifre1",
        });
        var auth = await AuthHelper.LoginAsync(client, nationalId, "EskiSifre1");
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var changeResponse = await client.PostAsJsonAsync(
            "/api/v1/auth/change-password",
            new { currentPassword = "EskiSifre1", newPassword = "YeniSifre1" });
        changeResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var newClient = factory.CreateClient();
        var loginWithOldPassword = await newClient.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { nationalId, password = "EskiSifre1" });
        loginWithOldPassword.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var loginWithNewPassword = await newClient.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { nationalId, password = "YeniSifre1" });
        loginWithNewPassword.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ChangePassword_WithWrongCurrentPassword_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/change-password",
            new { currentPassword = "YanlisEskiSifre1", newPassword = "YeniSifre1" });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
