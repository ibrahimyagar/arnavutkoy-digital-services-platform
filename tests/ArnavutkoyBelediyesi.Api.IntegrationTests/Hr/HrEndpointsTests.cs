using System.Net;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Api.IntegrationTests.Common;
using ArnavutkoyBelediyesi.Application.Features.Hr.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Hr;

[Collection(ApiCollection.Name)]
public sealed class HrEndpointsTests(ApiFactory factory)
{
    [Fact]
    public async Task GetDepartmentsAndStaff_AreAnonymouslyAccessible_WithSeedData()
    {
        var client = factory.CreateClient();

        var departmentsResponse = await client.GetAsync("/api/v1/departments");
        departmentsResponse.EnsureSuccessStatusCode();
        var departments = await departmentsResponse.ReadAsAsync<IReadOnlyCollection<DepartmentDto>>();
        departments.Should().NotBeEmpty();

        var staffResponse = await client.GetAsync("/api/v1/staff");
        staffResponse.EnsureSuccessStatusCode();
        var staff = await staffResponse.ReadAsAsync<IReadOnlyCollection<StaffMemberDto>>();
        staff.Should().NotBeEmpty();
        staff.Should().OnlyContain(s => departments!.Any(d => d.Id == s.DepartmentId));
    }

    [Fact]
    public async Task CreateDepartment_AsAdministrator_ShouldSucceed()
    {
        var client = factory.CreateClient();
        var admin = await AuthHelper.LoginAsync(
            client,
            ApiFactory.DemoUsers.AdministratorNationalId,
            ApiFactory.DemoUsers.AdministratorPassword);
        AuthHelper.AttachBearerToken(client, admin.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/departments", new
        {
            name = $"Test Departman {Guid.NewGuid():N}"[..24],
            description = "Entegrasyon testi",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
    }

    [Fact]
    public async Task CreateStaff_AsCitizen_ShouldReturn403()
    {
        var client = factory.CreateClient();
        var departments = await (await client.GetAsync("/api/v1/departments")).ReadAsAsync<IReadOnlyCollection<DepartmentDto>>();
        var auth = await AuthHelper.RegisterAndLoginCitizenAsync(client);
        AuthHelper.AttachBearerToken(client, auth.AccessToken);

        var response = await client.PostAsJsonAsync("/api/v1/staff", new
        {
            departmentId = departments!.First().Id,
            fullName = "Yetkisiz Personel",
            title = "Memur",
            email = "x@demo.local",
            phoneNumber = "+905550000099",
        });

        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
