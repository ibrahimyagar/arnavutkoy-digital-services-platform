using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;
using ArnavutkoyBelediyesi.Application.Features.Properties.Dtos;
using ArnavutkoyBelediyesi.Domain.Properties;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Properties;

[Collection(ApiCollection.Name)]
public sealed class PropertiesEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task RegisterProperty_AsCitizen_ThenGetMine_ShouldReturnIt()
    {
        var client = factory.CreateClient();
        var neighborhoods = await (await client.GetAsync("/api/v1/neighborhoods")).ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var neighborhoodId = neighborhoods!.First().Id;
        var streets = await (await client.GetAsync($"/api/v1/streets?neighborhoodId={neighborhoodId}"))
            .ReadAsAsync<IReadOnlyCollection<StreetDto>>();

        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var create = await client.PostAsJsonAsync("/api/v1/properties", new
        {
            neighborhoodId,
            streetId = streets!.FirstOrDefault()?.Id,
            type = PropertyType.Residential,
            title = "Test Konut",
            doorNumber = "12A",
            blockParcel = "100/5",
        });
        create.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await create.ReadAsAsync<CreatedIdResponse>();

        var mine = await (await client.GetAsync("/api/v1/properties/mine")).ReadAsAsync<PaginatedList<CitizenPropertyDto>>();
        mine!.Items.Should().Contain(p => p.Id == created!.Id && p.Title == "Test Konut");
    }

    [Fact]
    public async Task GetPropertyById_AsAnotherCitizen_ShouldReturn403()
    {
        var ownerClient = factory.CreateClient();
        var neighborhoods = await (await ownerClient.GetAsync("/api/v1/neighborhoods")).ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var owner = await AuthHelper.RegisterAndLoginCitizenAsync(ownerClient);
        AuthHelper.AttachBearerToken(ownerClient, owner.AccessToken);

        var create = await ownerClient.PostAsJsonAsync("/api/v1/properties", new
        {
            neighborhoodId = neighborhoods!.First().Id,
            streetId = (Guid?)null,
            type = PropertyType.Land,
            title = "Arsa",
            doorNumber = "1",
            blockParcel = "1/1",
        });
        var created = await create.ReadAsAsync<CreatedIdResponse>();

        var strangerClient = factory.CreateClient();
        var stranger = await AuthHelper.RegisterAndLoginCitizenAsync(strangerClient);
        AuthHelper.AttachBearerToken(strangerClient, stranger.AccessToken);

        var response = await strangerClient.GetAsync($"/api/v1/properties/{created!.Id}");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetMyProperties_WithoutAuth_ShouldReturn401()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/properties/mine");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
