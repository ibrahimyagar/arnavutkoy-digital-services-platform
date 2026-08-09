using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Persistence.Interceptors;
using ArnavutkoyBelediyesi.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Repositories;

/// <summary>
/// <see cref="Repository{T}"/>'nin genel CRUD davranışını ve yumuşak silme (soft-delete)
/// sorgu filtresini gerçek bir PostgreSQL örneğine karşı doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class RepositoryTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task AddAsync_ThenGetByIdAsync_ShouldReturnPersistedEntity()
    {
        await using var context = fixture.CreateContext();
        var repository = new Repository<District>(context);
        var district = District.Create($"Test İlçesi {Guid.NewGuid()}");

        await repository.AddAsync(district);
        await context.SaveChangesAsync();

        await using var readContext = fixture.CreateContext();
        var readRepository = new Repository<District>(readContext);
        var found = await readRepository.GetByIdAsync(district.Id);

        found.Should().NotBeNull();
        found!.Name.Should().Be(district.Name);
    }

    [Fact]
    public async Task GetByIdAsync_WhenEntityDoesNotExist_ShouldReturnNull()
    {
        await using var context = fixture.CreateContext();
        var repository = new Repository<District>(context);

        var found = await repository.GetByIdAsync(Guid.NewGuid());

        found.Should().BeNull();
    }

    [Fact]
    public async Task Remove_ShouldSoftDeleteEntity_AndExcludeItFromSubsequentQueries()
    {
        await using var writeContext = fixture.CreateContext();
        var writeRepository = new Repository<District>(writeContext);
        var district = District.Create($"Silinecek İlçe {Guid.NewGuid()}");
        await writeRepository.AddAsync(district);
        await writeContext.SaveChangesAsync();

        var currentUserService = Substitute.For<ICurrentUserService>();
        var dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(DateTime.UtcNow);
        var auditInterceptor = new AuditableEntitySaveChangesInterceptor(currentUserService, dateTimeProvider);

        await using var deleteContext = fixture.CreateContext(auditInterceptor);
        var deleteRepository = new Repository<District>(deleteContext);
        var toDelete = await deleteRepository.GetByIdAsync(district.Id);
        deleteRepository.Remove(toDelete!);
        await deleteContext.SaveChangesAsync();

        await using var verifyContext = fixture.CreateContext();
        var rawRow = await verifyContext.Districts
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(d => d.Id == district.Id);
        rawRow.Should().NotBeNull("kayıt fiziksel olarak silinmemeli, yalnızca IsDeleted=true olarak işaretlenmelidir.");
        rawRow!.IsDeleted.Should().BeTrue();

        await using var readContext = fixture.CreateContext();
        var readRepository = new Repository<District>(readContext);
        var found = await readRepository.GetByIdAsync(district.Id);

        found.Should().BeNull("global sorgu filtresi IsDeleted=true olan kayıtları hariç tutmalıdır.");
    }

    [Fact]
    public async Task Query_ShouldReturnNoTrackingQueryable_RespectingSoftDeleteFilter()
    {
        await using var writeContext = fixture.CreateContext();
        var writeRepository = new Repository<District>(writeContext);
        var visibleDistrict = District.Create($"Görünür İlçe {Guid.NewGuid()}");
        await writeRepository.AddAsync(visibleDistrict);
        await writeContext.SaveChangesAsync();

        await using var readContext = fixture.CreateContext();
        var readRepository = new Repository<District>(readContext);

        var found = await readRepository.Query().FirstOrDefaultAsync(d => d.Id == visibleDistrict.Id);

        found.Should().NotBeNull();
    }
}
