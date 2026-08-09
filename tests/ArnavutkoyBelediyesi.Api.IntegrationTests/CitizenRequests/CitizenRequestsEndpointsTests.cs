using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.CitizenRequests;

/// <summary>
/// Vatandaş taleplerinin oluşturulmasından kapatılmasına kadar tüm yaşam döngüsünü ve rol bazlı
/// erişim kurallarını gerçek bir veritabanına karşı doğrular.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class CitizenRequestsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetCategories_IsAnonymouslyAccessible_AndReturnsSeededActiveCategories()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/citizen-requests/categories");
        response.EnsureSuccessStatusCode();

        var categories = await response.ReadAsAsync<IReadOnlyCollection<RequestCategoryDto>>();
        categories.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task CreateRequest_AsAuthenticatedCitizen_ShouldReturn201AndBeRetrievableViaMine()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var categoryId = await GetFirstActiveCategoryIdAsync(client);

        var createResponse = await client.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId,
            initialMessage = "Sokağımdaki lamba çalışmıyor.",
        });
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var mineResponse = await client.GetAsync("/api/v1/citizen-requests/mine");
        mineResponse.EnsureSuccessStatusCode();
        var mine = await mineResponse.ReadAsAsync<PaginatedList<CitizenRequestSummaryDto>>();

        mine!.Items.Should().Contain(r => r.Id == created!.Id);
    }

    [Fact]
    public async Task CreateRequest_WithoutAuthentication_ShouldReturn401()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId = Guid.NewGuid(),
            initialMessage = "Kimliksiz istek.",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task CreateRequest_WithNonExistentCategory_ShouldReturn400()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId = Guid.NewGuid(),
            initialMessage = "Olmayan kategori.",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetRequestById_AsAnotherCitizen_ShouldReturn403()
    {
        var ownerClient = factory.CreateClient();
        var owner = await AuthHelper.RegisterAndLoginCitizenAsync(ownerClient);
        AuthHelper.AttachBearerToken(ownerClient, owner.AccessToken);
        var categoryId = await GetFirstActiveCategoryIdAsync(ownerClient);

        var createResponse = await ownerClient.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId,
            initialMessage = "Sahibine özel talep.",
        });
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var strangerClient = factory.CreateClient();
        var stranger = await AuthHelper.RegisterAndLoginCitizenAsync(strangerClient);
        AuthHelper.AttachBearerToken(strangerClient, stranger.AccessToken);

        var response = await strangerClient.GetAsync($"/api/v1/citizen-requests/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task FullLifecycle_AsOfficer_ShouldTransitionThroughUnderReviewResolveAndClose()
    {
        var citizenClient = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(citizenClient);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);
        var categoryId = await GetFirstActiveCategoryIdAsync(citizenClient);

        var createResponse = await citizenClient.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId,
            initialMessage = "Çöp konteyneri devrilmiş.",
        });
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(officerClient, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        var underReview = await officerClient.PostAsync($"/api/v1/citizen-requests/{created!.Id}/under-review", content: null);
        underReview.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var addMessage = await officerClient.PostAsJsonAsync(
            $"/api/v1/citizen-requests/{created.Id}/messages",
            new { message = "Ekibimiz yönlendirildi." });
        addMessage.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var resolve = await officerClient.PostAsync($"/api/v1/citizen-requests/{created.Id}/resolve", content: null);
        resolve.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var close = await officerClient.PostAsync($"/api/v1/citizen-requests/{created.Id}/close", content: null);
        close.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var detailResponse = await officerClient.GetAsync($"/api/v1/citizen-requests/{created.Id}");
        detailResponse.EnsureSuccessStatusCode();
        var detail = await detailResponse.ReadAsAsync<CitizenRequestDto>();

        detail!.Status.Should().Be(RequestStatus.Closed);
        detail.Messages.Should().HaveCount(2);
    }

    [Fact]
    public async Task AddMessage_ToClosedRequest_ShouldReturn400()
    {
        var citizenClient = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(citizenClient);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);
        var categoryId = await GetFirstActiveCategoryIdAsync(citizenClient);

        var createResponse = await citizenClient.PostAsJsonAsync("/api/v1/citizen-requests", new
        {
            categoryId,
            initialMessage = "Kapatılacak talep.",
        });
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(officerClient, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);
        await officerClient.PostAsync($"/api/v1/citizen-requests/{created!.Id}/close", content: null);

        var response = await citizenClient.PostAsJsonAsync(
            $"/api/v1/citizen-requests/{created.Id}/messages",
            new { message = "Kapalı talebe mesaj." });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetAllRequests_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/citizen-requests");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    private static async Task<Guid> GetFirstActiveCategoryIdAsync(HttpClient client)
    {
        var response = await client.GetAsync("/api/v1/citizen-requests/categories");
        response.EnsureSuccessStatusCode();
        var categories = await response.ReadAsAsync<IReadOnlyCollection<RequestCategoryDto>>();
        return categories!.First().Id;
    }
}
