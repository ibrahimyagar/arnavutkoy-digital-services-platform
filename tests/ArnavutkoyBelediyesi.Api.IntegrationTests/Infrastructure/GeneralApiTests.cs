using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Infrastructure;

/// <summary>
/// Belirli bir özelliğe bağlı olmayan, uygulama genelindeki davranışları (Swagger, API
/// sürümleme, bilinmeyen rotalar, doğrulama hatalarının biçimi) doğrular.
/// </summary>
[Collection(ApiCollection.Name)]
public sealed class GeneralApiTests(ApiFactory factory)
{
    [Fact]
    public async Task SwaggerJson_ForV1_ShouldBeReachable()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/v1/swagger.json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task UnknownRoute_ShouldReturn404()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/this-route-does-not-exist");

        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [Fact]
    public async Task RequestWithoutExplicitApiVersion_ShouldFallBackToDefaultVersion()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/v1/announcements");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Headers.Should().ContainKey("api-supported-versions");
    }

    [Fact]
    public async Task InvalidRequestBody_ShouldReturnProblemDetailsWithBadRequestStatus()
    {
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId = "",
            fullName = "",
            phoneNumber = "",
            password = "",
        });

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        var problem = await response.ReadAsAsync<ProblemDetailsResponse>();
        problem!.Status.Should().Be((int)HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task ProtectedEndpoint_WithMalformedBearerToken_ShouldReturn401()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("Authorization", "Bearer bu-gecerli-bir-jwt-degil");

        var response = await client.GetAsync("/api/v1/debts/mine");

        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }
}
