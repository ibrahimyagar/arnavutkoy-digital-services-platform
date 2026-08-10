using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.Transportation.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Transportation;

[Collection(ApiCollection.Name)]
public sealed class TransportationEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetBusLines_IsAnonymouslyAccessible_WithSeedData()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/bus-lines");
        response.EnsureSuccessStatusCode();
        var lines = await response.ReadAsAsync<IReadOnlyCollection<BusLineDto>>();

        lines.Should().NotBeEmpty();
        lines.Should().OnlyContain(l => l.BaseFare > 0);
    }

    [Fact]
    public async Task IssueCard_TopUp_AndBoard_ShouldDeductFare()
    {
        var client = factory.CreateClient();
        var lines = await (await client.GetAsync("/api/v1/bus-lines")).ReadAsAsync<IReadOnlyCollection<BusLineDto>>();
        var line = lines!.OrderBy(l => l.BaseFare).First();

        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var issue = await client.PostAsJsonAsync("/api/v1/transport-cards", new
        {
            cardNumber = $"TK-{Guid.NewGuid():N}"[..14],
            initialBalance = 0m,
        });
        issue.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await issue.ReadAsAsync<CreatedIdResponse>();

        (await client.PostAsJsonAsync($"/api/v1/transport-cards/{created!.Id}/top-up", new { amount = 100m }))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var board = await client.PostAsJsonAsync($"/api/v1/transport-cards/{created.Id}/board", new
        {
            busLineId = line.Id,
        });
        board.StatusCode.Should().Be(HttpStatusCode.Created);

        var card = await (await client.GetAsync($"/api/v1/transport-cards/{created.Id}"))
            .ReadAsAsync<TransportCardDto>();
        card!.Balance.Should().Be(100m - line.BaseFare);
    }

    [Fact]
    public async Task Board_WithInsufficientBalance_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var lines = await (await client.GetAsync("/api/v1/bus-lines")).ReadAsAsync<IReadOnlyCollection<BusLineDto>>();
        var line = lines!.OrderByDescending(l => l.BaseFare).First();

        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var issue = await client.PostAsJsonAsync("/api/v1/transport-cards", new
        {
            cardNumber = $"TK-{Guid.NewGuid():N}"[..14],
            initialBalance = 1m,
        });
        var created = await issue.ReadAsAsync<CreatedIdResponse>();

        var board = await client.PostAsJsonAsync($"/api/v1/transport-cards/{created!.Id}/board", new
        {
            busLineId = line.Id,
        });
        board.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBusLine_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/bus-lines", new
        {
            code = "XX1",
            name = "Yetkisiz Hat",
            routeSummary = "A-B",
            baseFare = 10m,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
