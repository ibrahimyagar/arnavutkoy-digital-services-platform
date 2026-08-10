using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Geography;

[Collection(ApiCollection.Name)]
public sealed class StreetsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetStreets_IsAnonymouslyAccessible_AndReturnsSeededStreets()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/streets");
        response.EnsureSuccessStatusCode();
        var streets = await response.ReadAsAsync<IReadOnlyCollection<StreetDto>>();

        streets.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CreateStreet_AsAdministrator_ShouldSucceed()
    {
        var client = factory.CreateClient();
        var neighborhoods = await (await client.GetAsync("/api/v1/neighborhoods")).ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var neighborhoodId = neighborhoods!.First().Id;

        var admin = await AuthHelper.LoginAsync(
            client,
            ApiFactory.DemoUsers.AdministratorNationalId,
            ApiFactory.DemoUsers.AdministratorPassword);
        AuthHelper.AttachBearerToken(client, admin.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/streets", new
        {
            neighborhoodId,
            name = $"Test Sokak {Guid.NewGuid():N}"[..20],
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateStreet_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var neighborhoods = await (await client.GetAsync("/api/v1/neighborhoods")).ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/streets", new
        {
            neighborhoodId = neighborhoods!.First().Id,
            name = "Yetkisiz Sokak",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
