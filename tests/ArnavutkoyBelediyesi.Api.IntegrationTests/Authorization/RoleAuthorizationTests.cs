using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Authorization;

/// <summary>
/// Rol tabanlı yetkilendirmenin (Citizen / Officer / Administrator), yönetimsel uç noktalar
/// üzerinde beklendiği gibi uygulandığını doğrular. Referans projedeki "her işlem her
/// oturuma açık" anti-pattern'ine karşı bir güvenlik regresyon testi seti olarak görev görür.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class RoleAuthorizationTests(ApiFactory factory)
{
    [Fact]
    public async Task CreateDistrict_AsAdministrator_ShouldSucceed()
    {
        var client = factory.CreateClient();
        var admin = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.AdministratorNationalId, ApiFactory.DemoUsers.AdministratorPassword);
        AuthHelper.AttachBearerToken(client, admin.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/districts", new { name = $"Test İlçe {Guid.NewGuid():N}" });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Theory]
    [InlineData(ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword)]
    [InlineData(ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword)]
    public async Task CreateDistrict_AsNonAdministrator_ShouldReturn403(string nationalId, string password)
    {
        var client = factory.CreateClient();
        var user = await AuthHelper.LoginAsync(client, nationalId, password);
        AuthHelper.AttachBearerToken(client, user.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/districts", new { name = "Yetkisiz İlçe" });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateNeighborhood_AsOfficer_ShouldReturn403_OnlyAdministratorManagesGeography()
    {
        var client = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(client, officer.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/neighborhoods", new
        {
            districtId = Guid.NewGuid(),
            name = "Yetkisiz Mahalle",
            headmanFullName = "Test Muhtar",
            headmanPhoneNumber = "+905550000000",
            population = 100,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetDistricts_IsAnonymouslyAccessible()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/districts");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ManageAnnouncements_AsOfficer_ShouldBeAllowed_OfficerAndAdministratorShareContentManagement()
    {
        var client = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(client, officer.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/announcements", new
        {
            title = "Görevli Duyurusu",
            content = "Officer rolü de duyuru yönetebilir.",
            publishEndUtc = (DateTime?)null,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task GetAllCitizenRequests_AsAdministrator_ShouldBeAllowed()
    {
        var client = factory.CreateClient();
        var admin = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.AdministratorNationalId, ApiFactory.DemoUsers.AdministratorPassword);
        AuthHelper.AttachBearerToken(client, admin.AccessToken);

        var response = await client.GetAsync("/api/v1/citizen-requests");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task ExpiredOrTamperedAccessToken_ShouldBeRejectedWith401()
    {
        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);

        var tamperedToken = citizen.AccessToken[..^5] + "aaaaa";
        AuthHelper.AttachBearerToken(client, tamperedToken);

        var response = await client.GetAsync("/api/v1/debts/mine");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
