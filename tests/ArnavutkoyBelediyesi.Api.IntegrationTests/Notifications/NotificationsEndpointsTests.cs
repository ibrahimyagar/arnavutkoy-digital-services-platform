using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Notifications.Dtos;
using ArnavutkoyBelediyesi.Domain.Notifications;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Notifications;

[Collection(ApiCollection.Name)]
public sealed class NotificationsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetMine_WithoutAuthentication_ShouldReturn401()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/notifications/mine");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task GetMine_AsCitizen_ShouldReturnEmptyOrOwnPage()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/notifications/mine");
        response.EnsureSuccessStatusCode();

        var page = await response.ReadAsAsync<PaginatedList<NotificationLogDto>>();
        page.Should().NotBeNull();
        page!.Items.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAll_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/notifications");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task SendTest_AsAdministrator_ShouldCreateNotificationVisibleInMine()
    {
        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        var citizenUserId = citizen.UserId;

        var admin = await AuthHelper.LoginAsync(
            client,
            ApiFactory.DemoUsers.AdministratorEmail,
            ApiFactory.DemoUsers.AdministratorPassword);
        AuthHelper.AttachBearerToken(client, admin.AccessToken);

        var create = await client.PostAsJsonAsync("/api/v1/notifications/test", new
        {
            recipientUserId = citizenUserId,
            channel = nameof(NotificationChannel.InApp),
            subject = "Test bildirimi",
            body = "Bu bir demo bildirimdir.",
        });
        create.StatusCode.Should().Be(HttpStatusCode.Created);

        AuthHelper.AttachBearerToken(client, citizen.AccessToken);
        var mine = await client.GetAsync("/api/v1/notifications/mine");
        mine.EnsureSuccessStatusCode();
        var page = await mine.ReadAsAsync<PaginatedList<NotificationLogDto>>();

        page!.Items.Should().Contain(n => n.Subject == "Test bildirimi" && n.RecipientUserId == citizenUserId);
    }

    [Fact]
    public async Task GetAll_AsOfficer_ShouldSucceed()
    {
        var client = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(
            client,
            ApiFactory.DemoUsers.OfficerEmail,
            ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(client, officer.AccessToken);

        var response = await client.GetAsync("/api/v1/notifications?pageNumber=1&pageSize=10");
        response.EnsureSuccessStatusCode();

        var page = await response.ReadAsAsync<PaginatedList<NotificationLogDto>>();
        page.Should().NotBeNull();
    }
}
