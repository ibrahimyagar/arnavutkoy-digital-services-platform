using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;
using ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;
using ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Dtos;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.UtilitySubscriptions;

[Collection(ApiCollection.Name)]
public sealed class WaterSubscriptionsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task OpenSubscription_AsCitizen_ThenOfficerCreatesWaterDebt()
    {
        var citizenClient = factory.CreateClient();
        var neighborhoods = await (await citizenClient.GetAsync("/api/v1/neighborhoods"))
            .ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(citizenClient);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);

        var open = await citizenClient.PostAsJsonAsync("/api/v1/water-subscriptions", new
        {
            neighborhoodId = neighborhoods!.First().Id,
            propertyId = (Guid?)null,
            subscriptionNumber = $"AK-{Guid.NewGuid():N}"[..12],
        });
        open.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await open.ReadAsAsync<CreatedIdResponse>();
        created.Should().NotBeNull();

        var mine = await (await citizenClient.GetAsync("/api/v1/water-subscriptions/mine"))
            .ReadAsAsync<PaginatedList<WaterSubscriptionDto>>();
        mine!.Items.Should().Contain(s => s.Id == created!.Id && s.Status == WaterSubscriptionStatus.Active);

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(
            officerClient,
            ApiFactory.DemoUsers.OfficerNationalId,
            ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        var debtResponse = await officerClient.PostAsJsonAsync($"/api/v1/water-subscriptions/{created.Id}/debts", new
        {
            principalAmount = 125.75m,
            dueDateUtc = DateTime.UtcNow.AddDays(20),
        });
        debtResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var debts = await (await citizenClient.GetAsync("/api/v1/debts/mine")).ReadAsAsync<PaginatedList<DebtDto>>();
        debts!.Items.Should().Contain(d => d.Type == DebtType.Water && d.PrincipalAmount == 125.75m);
    }

    [Fact]
    public async Task Suspend_ThenCreateDebt_ShouldFail()
    {
        var citizenClient = factory.CreateClient();
        var neighborhoods = await (await citizenClient.GetAsync("/api/v1/neighborhoods"))
            .ReadAsAsync<IReadOnlyCollection<NeighborhoodDto>>();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(citizenClient);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);

        var open = await citizenClient.PostAsJsonAsync("/api/v1/water-subscriptions", new
        {
            neighborhoodId = neighborhoods!.First().Id,
            propertyId = (Guid?)null,
            subscriptionNumber = $"AK-{Guid.NewGuid():N}"[..12],
        });
        var created = await open.ReadAsAsync<CreatedIdResponse>();

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(
            officerClient,
            ApiFactory.DemoUsers.OfficerNationalId,
            ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        (await officerClient.PostAsync($"/api/v1/water-subscriptions/{created!.Id}/suspend", content: null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        var debtResponse = await officerClient.PostAsJsonAsync($"/api/v1/water-subscriptions/{created.Id}/debts", new
        {
            principalAmount = 50m,
            dueDateUtc = DateTime.UtcNow.AddDays(10),
        });
        debtResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
