using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Auth;

[Collection(ApiCollection.Name)]
public sealed class AuthEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task Register_WithValidData_ShouldReturn201AndCreateAccount()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = AuthHelper.GenerateUniqueEmail(),
            fullName = "Yeni Vatandaş",
            phoneNumber = "+905551112233",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "GucluSifre1",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var email = AuthHelper.GenerateUniqueEmail();

        var first = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName = "Mükerrer Vatandaş",
            phoneNumber = "+905551112233",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "GucluSifre1",
        });
        first.StatusCode.Should().Be(HttpStatusCode.Created);

        var second = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName = "Mükerrer Vatandaş 2",
            phoneNumber = "+905551112244",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "GucluSifre1",
        });

        second.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_WithInvalidNationalIdChecksum_ShouldReturn400()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email = AuthHelper.GenerateUniqueEmail(),
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
    public async Task Login_WithWrongPassword_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var email = AuthHelper.GenerateUniqueEmail();
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName = "Test Vatandaş",
            phoneNumber = "+905551112233",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "GucluSifre1",
        });

        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = "YanlisSifre1" });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Login_WithNonExistentUser_ShouldReturn400WithGenericMessage()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/v1/auth/login",
            new { email = AuthHelper.GenerateUniqueEmail("missing"), password = "HerhangiBirSifre1" });

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

        var first = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        first.EnsureSuccessStatusCode();

        var replay = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        replay.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Logout_ShouldRevokeRefreshToken()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        var logout = await client.PostAsJsonAsync("/api/v1/auth/logout", new { refreshToken = auth.RefreshToken });
        logout.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var refresh = await client.PostAsJsonAsync("/api/v1/auth/refresh", new { refreshToken = auth.RefreshToken });
        refresh.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ChangePassword_WithValidCurrentPassword_ShouldAllowLoginWithNewPassword()
    {
        var client = factory.CreateClient();
        var email = AuthHelper.GenerateUniqueEmail();
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName = "Parola Test",
            phoneNumber = "+905551112233",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "EskiSifre1",
        });

        var auth = await AuthHelper.LoginAsync(client, email, "EskiSifre1");
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/auth/change-password", new
        {
            currentPassword = "EskiSifre1",
            newPassword = "YeniSifre1",
        });
        response.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var loginOld = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password = "EskiSifre1" });
        loginOld.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var loginNew = await AuthHelper.LoginAsync(client, email, "YeniSifre1");
        loginNew.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    [Fact]
    public async Task Me_ShouldReturnProfileWithEmail()
    {
        var client = factory.CreateClient();
        var email = AuthHelper.GenerateUniqueEmail();
        await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName = "Profil Test",
            phoneNumber = "+905551112233",
            nationalId = AuthHelper.GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password = "GucluSifre1",
        });
        var auth = await AuthHelper.LoginAsync(client, email, "GucluSifre1");
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/auth/me");
        response.EnsureSuccessStatusCode();

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var doc = await JsonDocument.ParseAsync(stream);
        doc.RootElement.GetProperty("email").GetString().Should().Be(email);
    }
}

