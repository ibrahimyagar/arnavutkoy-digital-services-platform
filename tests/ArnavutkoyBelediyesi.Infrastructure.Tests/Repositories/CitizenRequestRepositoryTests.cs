using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Persistence.Repositories;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Repositories;

/// <summary>
/// <see cref="CitizenRequestRepository.GetByIdWithMessagesAsync"/>'in, mesaj geçmişini
/// N+1 sorgusu oluşturmadan tek seferde (<c>Include</c>) getirdiğini doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class CitizenRequestRepositoryTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task GetByIdWithMessagesAsync_ShouldReturnRequestWithAllMessagesEagerLoaded()
    {
        var citizenId = Guid.NewGuid();

        await using var writeContext = fixture.CreateContext();
        var category = RequestCategory.Create($"Kategori {Guid.NewGuid()}");
        writeContext.RequestCategories.Add(category);
        await writeContext.SaveChangesAsync();

        var request = CitizenRequest.Create(citizenId, category.Id, "İlk mesaj");
        request.AddMessage(Guid.NewGuid(), SenderType.Officer, "İkinci mesaj");
        request.AddMessage(citizenId, SenderType.Citizen, "Üçüncü mesaj");
        writeContext.CitizenRequests.Add(request);
        await writeContext.SaveChangesAsync();

        await using var readContext = fixture.CreateContext();
        var repository = new CitizenRequestRepository(readContext);

        var found = await repository.GetByIdWithMessagesAsync(request.Id);

        found.Should().NotBeNull();
        found!.Messages.Should().HaveCount(3);
        found.Messages.Select(m => m.Message).Should().Contain(["İlk mesaj", "İkinci mesaj", "Üçüncü mesaj"]);
    }

    [Fact]
    public async Task GetByIdWithMessagesAsync_WhenRequestDoesNotExist_ShouldReturnNull()
    {
        await using var context = fixture.CreateContext();
        var repository = new CitizenRequestRepository(context);

        var found = await repository.GetByIdWithMessagesAsync(Guid.NewGuid());

        found.Should().BeNull();
    }
}
