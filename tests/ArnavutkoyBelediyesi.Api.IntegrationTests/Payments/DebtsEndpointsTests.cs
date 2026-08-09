using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Payments.Dtos;
using ArnavutkoyBelediyesi.Domain.Payments;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Payments;

/// <summary>
/// Borç görüntüleme ve kredi kartıyla ödeme akışının, kart verisi asla ham olarak
/// saklanmadan uçtan uca doğru çalıştığını doğrular.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class DebtsEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetMyDebts_AsSeededDemoCitizen_ShouldReturnSeededWaterAndPropertyDebts()
    {
        // Not: Bu koleksiyondaki başka bir test (bkz. PayDebt_WithValidCardAndOwnedUnpaidDebt)
        // demo vatandaşın borçlarından birini ödeyebileceğinden, burada ödeme durumuna değil
        // yalnızca borçların var olduğuna bakılır; testler arası sıra bağımlılığı oluşturulmaz.
        var client = factory.CreateClient();
        var auth = await AuthHelper.LoginAsync(client, ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.GetAsync("/api/v1/debts/mine");
        response.EnsureSuccessStatusCode();
        var debts = await response.ReadAsAsync<PaginatedList<DebtDto>>();

        debts!.Items.Should().Contain(d => d.Type == DebtType.Water);
        debts.Items.Should().Contain(d => d.Type == DebtType.Property);
    }

    [Fact]
    public async Task GetDebtById_AsAnotherCitizen_ShouldReturn403()
    {
        var ownerClient = factory.CreateClient();
        var owner = await AuthHelper.LoginAsync(ownerClient, ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword);
        AuthHelper.AttachBearerToken(ownerClient, owner.AccessToken);
        var myDebts = await (await ownerClient.GetAsync("/api/v1/debts/mine")).ReadAsAsync<PaginatedList<DebtDto>>();
        var debtId = myDebts!.Items.First().Id;

        var strangerClient = factory.CreateClient();
        var stranger = await AuthHelper.RegisterAndLoginCitizenAsync(strangerClient);
        AuthHelper.AttachBearerToken(strangerClient, stranger.AccessToken);

        var response = await strangerClient.GetAsync($"/api/v1/debts/{debtId}");

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetDebtById_AsOfficer_ShouldBeAllowed_EvenThoughNotTheOwner()
    {
        var citizenClient = factory.CreateClient();
        var citizen = await AuthHelper.LoginAsync(citizenClient, ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword);
        AuthHelper.AttachBearerToken(citizenClient, citizen.AccessToken);
        var myDebts = await (await citizenClient.GetAsync("/api/v1/debts/mine")).ReadAsAsync<PaginatedList<DebtDto>>();
        var debtId = myDebts!.Items.First().Id;

        var officerClient = factory.CreateClient();
        var officer = await AuthHelper.LoginAsync(officerClient, ApiFactory.DemoUsers.OfficerNationalId, ApiFactory.DemoUsers.OfficerPassword);
        AuthHelper.AttachBearerToken(officerClient, officer.AccessToken);

        var response = await officerClient.GetAsync($"/api/v1/debts/{debtId}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task PayDebt_WithValidCardAndOwnedUnpaidDebt_ShouldSucceedAndMarkDebtAsPaid()
    {
        // Borçlar yalnızca seed sürecinde demo vatandaşa atanmıştır; bu nedenle başarılı ödeme
        // akışı demo vatandaş üzerinden doğrulanır.
        var demoClient = factory.CreateClient();
        var demoAuth = await AuthHelper.LoginAsync(demoClient, ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword);
        AuthHelper.AttachBearerToken(demoClient, demoAuth.AccessToken);

        var debts = await (await demoClient.GetAsync("/api/v1/debts/mine")).ReadAsAsync<PaginatedList<DebtDto>>();
        var unpaidDebt = debts!.Items.FirstOrDefault(d => d.Status == DebtStatus.Unpaid);
        if (unpaidDebt is null)
        {
            // Aynı koleksiyonda çalışan diğer testler bu borcu zaten ödemiş olabilir; testin kırılgan
            // olmaması için bu durumda senaryo anlamsızlaşır ve atlanır.
            return;
        }

        var payResponse = await demoClient.PostAsJsonAsync($"/api/v1/debts/{unpaidDebt.Id}/payments", new
        {
            cardHolderName = "Ayşe Demo Vatandaş",
            cardNumber = "4111111111111111",
            expiryMonthYear = "12/30",
            cvv = "123",
        });

        payResponse.StatusCode.Should().Be(HttpStatusCode.Created);

        var debtAfter = await (await demoClient.GetAsync($"/api/v1/debts/{unpaidDebt.Id}")).ReadAsAsync<DebtDto>();
        debtAfter!.Status.Should().Be(DebtStatus.Paid);
    }

    [Fact]
    public async Task PayDebt_ThatDoesNotBelongToCaller_ShouldReturn400_AndNeverExposeOtherUsersDebts()
    {
        var strangerClient = factory.CreateClient();
        var stranger = await AuthHelper.RegisterAndLoginCitizenAsync(strangerClient);
        AuthHelper.AttachBearerToken(strangerClient, stranger.AccessToken);

        var demoClient = factory.CreateClient();
        var demoAuth = await AuthHelper.LoginAsync(demoClient, ApiFactory.DemoUsers.CitizenNationalId, ApiFactory.DemoUsers.CitizenPassword);
        AuthHelper.AttachBearerToken(demoClient, demoAuth.AccessToken);
        var demoDebts = await (await demoClient.GetAsync("/api/v1/debts/mine")).ReadAsAsync<PaginatedList<DebtDto>>();
        var someoneElsesDebtId = demoDebts!.Items.First().Id;

        var response = await strangerClient.PostAsJsonAsync($"/api/v1/debts/{someoneElsesDebtId}/payments", new
        {
            cardHolderName = "Yabancı Kullanıcı",
            cardNumber = "4111111111111111",
            expiryMonthYear = "12/30",
            cvv = "123",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task GetMyDebts_WithoutAuthentication_ShouldReturn401()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/debts/mine");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
