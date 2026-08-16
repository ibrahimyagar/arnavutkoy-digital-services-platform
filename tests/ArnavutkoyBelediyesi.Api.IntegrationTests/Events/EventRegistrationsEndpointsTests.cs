using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Events;
using ArnavutkoyBelediyesi.Application.Features.Portal;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Events;

[Collection(ApiCollection.Name)]
public sealed class EventRegistrationsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task Register_Duplicate_Cancel_Reregister_FullFlow()
    {
        var anon = factory.CreateClient();
        var page = await (await anon.GetAsync("/api/v1/portal?kind=Event&pageSize=50"))
            .ReadAsAsync<PaginatedList<PortalContentDto>>();
        page.Should().NotBeNull();
        page!.Items.Should().NotBeEmpty();
        var portalEvent = page.Items.First();

        var guestRegister = await anon.PostAsJsonAsync("/api/v1/event-registrations", new { eventId = portalEvent.Id });
        guestRegister.StatusCode.Should().Be(HttpStatusCode.Unauthorized);

        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, citizen.AccessToken);

        var created = await client.PostAsJsonAsync("/api/v1/event-registrations", new { eventId = portalEvent.Id });
        created.StatusCode.Should().Be(HttpStatusCode.OK);
        var registration = await created.ReadAsAsync<EventRegistrationDto>();
        registration.Should().NotBeNull();
        registration!.EventId.Should().Be(portalEvent.Id);
        registration.Status.Should().Be("Registered");

        var duplicate = await client.PostAsJsonAsync("/api/v1/event-registrations", new { eventId = portalEvent.Id });
        duplicate.StatusCode.Should().Be(HttpStatusCode.BadRequest);

        var mine = await (await client.GetAsync("/api/v1/event-registrations/mine"))
            .ReadAsAsync<IReadOnlyList<EventRegistrationDto>>();
        mine.Should().Contain(x => x.EventId == portalEvent.Id && x.Status == "Registered");

        var status = await (await client.GetAsync($"/api/v1/event-registrations/status/{portalEvent.Id}"))
            .ReadAsAsync<EventRegistrationStatusDto>();
        status.Should().NotBeNull();
        status!.IsRegistered.Should().BeTrue();
        status.RegisteredCount.Should().BeGreaterThanOrEqualTo(1);

        var cancel = await client.PostAsync($"/api/v1/event-registrations/{portalEvent.Id}/cancel", content: null);
        cancel.StatusCode.Should().Be(HttpStatusCode.NoContent);

        var afterCancel = await (await client.GetAsync($"/api/v1/event-registrations/status/{portalEvent.Id}"))
            .ReadAsAsync<EventRegistrationStatusDto>();
        afterCancel!.IsRegistered.Should().BeFalse();

        var again = await client.PostAsJsonAsync("/api/v1/event-registrations", new { eventId = portalEvent.Id });
        again.StatusCode.Should().Be(HttpStatusCode.OK);
        var restored = await again.ReadAsAsync<EventRegistrationDto>();
        restored!.Status.Should().Be("Registered");
    }

    [Fact]
    public async Task Status_AsGuest_DoesNotLeakRegistration()
    {
        var client = factory.CreateClient();
        var page = await (await client.GetAsync("/api/v1/portal?kind=Event&pageSize=1"))
            .ReadAsAsync<PaginatedList<PortalContentDto>>();
        var portalEvent = page!.Items.First();

        var status = await (await client.GetAsync($"/api/v1/event-registrations/status/{portalEvent.Id}"))
            .ReadAsAsync<EventRegistrationStatusDto>();
        status.Should().NotBeNull();
        status!.IsRegistered.Should().BeFalse();
        status.EventId.Should().Be(portalEvent.Id);
    }

    [Fact]
    public async Task Cancel_WithoutRegistration_Returns400()
    {
        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, citizen.AccessToken);

        var page = await (await client.GetAsync("/api/v1/portal?kind=Event&pageSize=1"))
            .ReadAsAsync<PaginatedList<PortalContentDto>>();
        var cancel = await client.PostAsync(
            $"/api/v1/event-registrations/{page!.Items.First().Id}/cancel",
            content: null);
        cancel.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task Register_UnknownEvent_Returns400()
    {
        var client = factory.CreateClient();
        var citizen = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, citizen.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/event-registrations", new { eventId = Guid.NewGuid() });
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
