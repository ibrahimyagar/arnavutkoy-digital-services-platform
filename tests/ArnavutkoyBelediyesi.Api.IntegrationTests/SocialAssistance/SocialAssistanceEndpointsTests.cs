using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Dtos;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.SocialAssistance;

[Collection(ApiCollection.Name)]
public sealed class SocialAssistanceEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task Submit_StartReview_Approve_FullFlow()
    {
        var citizenClient = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(citizenClient);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);

        var submit = await citizenClient.PostAsJsonAsync("/api/v1/social-assistance", new
        {
            type = AssistanceType.Food,
            householdSize = 3,
            monthlyIncome = 15000m,
            householdSummary = "3 kişilik hane, kira ödüyor",
            extraFieldsJson = """{"needs":"gıda kolisi"}""",
        });
        submit.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await submit.ReadAsAsync<CreatedIdResponse>();

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(
            officerClient,
            ApiFactory.DemoUsers.OfficerNationalId,
            ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        (await officerClient.PostAsync($"/api/v1/social-assistance/{created!.Id}/start-review", content: null))
            .StatusCode.Should().Be(HttpStatusCode.NoContent);

        (await officerClient.PostAsJsonAsync($"/api/v1/social-assistance/{created.Id}/decide", new
        {
            approve = true,
            note = "Uygun görüldü",
        })).StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (await citizenClient.GetAsync($"/api/v1/social-assistance/{created.Id}"))
            .ReadAsAsync<SocialAssistanceApplicationDto>();
        detail!.Status.Should().Be(SocialAssistanceApplicationStatus.Approved);
    }

    [Fact]
    public async Task Withdraw_AsOwner_WhileSubmitted_ShouldSucceed()
    {
        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, citizen.AccessToken);

        var submit = await client.PostAsJsonAsync("/api/v1/social-assistance", new
        {
            type = AssistanceType.Heating,
            householdSize = 2,
            monthlyIncome = 8000m,
            householdSummary = "Isınma yardımı",
            extraFieldsJson = (string?)null,
        });
        var created = await submit.ReadAsAsync<CreatedIdResponse>();

        var withdraw = await client.PostAsync($"/api/v1/social-assistance/{created!.Id}/withdraw", content: null);
        withdraw.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detail = await (await client.GetAsync($"/api/v1/social-assistance/{created.Id}"))
            .ReadAsAsync<SocialAssistanceApplicationDto>();
        detail!.Status.Should().Be(SocialAssistanceApplicationStatus.Withdrawn);
    }

    [Fact]
    public async Task GetAll_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/social-assistance");
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
