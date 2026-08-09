using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Dtos;
using ArnavutkoyBelediyesi.Domain.Announcements;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Announcements;

/// <summary>
/// Duyuru yaşam döngüsünün (taslak → yayında → arşivde) ve görünürlük kurallarının uçtan uca
/// doğru çalıştığını doğrular.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class AnnouncementsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetPublishedAnnouncements_IsAnonymouslyAccessible_AndReturnsOnlySeededPublishedOnes()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/announcements");
        response.EnsureSuccessStatusCode();
        var page = await response.ReadAsAsync<PaginatedList<AnnouncementDto>>();

        page!.Items.Should().NotBeEmpty();
        page.Items.Should().OnlyContain(a => a.Status == AnnouncementStatus.Published);
    }

    [Fact]
    public async Task CreateAnnouncement_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/announcements", new
        {
            title = "Yetkisiz Duyuru",
            content = "Bu içerik yayınlanmamalı.",
            publishEndUtc = (DateTime?)null,
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task FullLifecycle_AsOfficer_ShouldCreateUpdatePublishAndArchive()
    {
        var client = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(client, officer.AccessToken);

        var createResponse = await client.PostAsJsonAsync("/api/v1/announcements", new
        {
            title = "Test Duyurusu",
            content = "Bu duyuru entegrasyon testinden oluşturuldu.",
            publishEndUtc = (DateTime?)null,
        });
        createResponse.StatusCode.Should().Be(HttpStatusCode.Created);
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var draftBeforePublish = await client.GetAsync($"/api/v1/announcements/{created!.Id}");
        draftBeforePublish.EnsureSuccessStatusCode();
        var draftDto = await draftBeforePublish.ReadAsAsync<AnnouncementDto>();
        draftDto!.Status.Should().Be(AnnouncementStatus.Draft);

        var updateResponse = await client.PutAsJsonAsync($"/api/v1/announcements/{created.Id}", new
        {
            title = "Güncellenmiş Test Duyurusu",
            content = "İçerik güncellendi.",
        });
        updateResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var publishResponse = await client.PostAsync($"/api/v1/announcements/{created.Id}/publish", content: null);
        publishResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var publishedDto = await (await client.GetAsync($"/api/v1/announcements/{created.Id}")).ReadAsAsync<AnnouncementDto>();
        publishedDto!.Status.Should().Be(AnnouncementStatus.Published);
        publishedDto.Title.Should().Be("Güncellenmiş Test Duyurusu");

        var archiveResponse = await client.PostAsync($"/api/v1/announcements/{created.Id}/archive", content: null);
        archiveResponse.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var archivedDto = await (await client.GetAsync($"/api/v1/announcements/{created.Id}")).ReadAsAsync<AnnouncementDto>();
        archivedDto!.Status.Should().Be(AnnouncementStatus.Archived);
    }

    [Fact]
    public async Task GetAnnouncementById_ForDraft_AsAnonymousUser_ShouldReturn400_HidingItsExistence()
    {
        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(officerClient, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        var createResponse = await officerClient.PostAsJsonAsync("/api/v1/announcements", new
        {
            title = "Gizli Taslak",
            content = "Henüz yayınlanmadı.",
            publishEndUtc = (DateTime?)null,
        });
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();

        var anonymousClient = factory.CreateClient();
        var response = await anonymousClient.GetAsync($"/api/v1/announcements/{created!.Id}");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task UpdateAnnouncement_AfterPublish_ShouldReturn400_BecauseOnlyDraftsAreEditable()
    {
        var client = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(client, officer.AccessToken);

        var createResponse = await client.PostAsJsonAsync("/api/v1/announcements", new
        {
            title = "Yayınlanacak Duyuru",
            content = "İçerik.",
            publishEndUtc = (DateTime?)null,
        });
        var created = await createResponse.ReadAsAsync<CreatedIdResponse>();
        await client.PostAsync($"/api/v1/announcements/{created!.Id}/publish", content: null);

        var updateResponse = await client.PutAsJsonAsync($"/api/v1/announcements/{created.Id}", new
        {
            title = "Yayındayken Değiştirilemez",
            content = "İçerik.",
        });

        updateResponse.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
