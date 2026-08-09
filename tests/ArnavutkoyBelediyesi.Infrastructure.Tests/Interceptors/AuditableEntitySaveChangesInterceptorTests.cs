using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Persistence.Interceptors;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Interceptors;

/// <summary>
/// <see cref="AuditableEntitySaveChangesInterceptor"/>'ın oluşturma/güncelleme alanlarını otomatik
/// doldurduğunu ve domain kodunun bu alanları elle set etmesine gerek olmadığını doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class AuditableEntitySaveChangesInterceptorTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task SavingChanges_WhenEntityAdded_ShouldSetCreatedAtUtcAndCreatedBy()
    {
        var userId = Guid.NewGuid();
        var now = new DateTime(2026, 4, 1, 8, 30, 0, DateTimeKind.Utc);
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.UserId.Returns(userId);
        var dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(now);
        var interceptor = new AuditableEntitySaveChangesInterceptor(currentUserService, dateTimeProvider);

        await using var context = fixture.CreateContext(interceptor);
        var district = District.Create($"Denetimli İlçe {Guid.NewGuid()}");
        context.Districts.Add(district);

        await context.SaveChangesAsync();

        district.CreatedAtUtc.Should().Be(now);
        district.CreatedBy.Should().Be(userId.ToString());
        district.UpdatedAtUtc.Should().BeNull();
    }

    [Fact]
    public async Task SavingChanges_WhenEntityModified_ShouldSetUpdatedAtUtcAndUpdatedBy()
    {
        var creatorId = Guid.NewGuid();
        var editorId = Guid.NewGuid();
        var createdAt = new DateTime(2026, 4, 1, 8, 30, 0, DateTimeKind.Utc);
        var updatedAt = createdAt.AddDays(1);

        var creatorService = Substitute.For<ICurrentUserService>();
        creatorService.UserId.Returns(creatorId);
        var creationTimeProvider = Substitute.For<IDateTimeProvider>();
        creationTimeProvider.UtcNow.Returns(createdAt);

        await using var createContext = fixture.CreateContext(
            new AuditableEntitySaveChangesInterceptor(creatorService, creationTimeProvider));
        var district = District.Create($"Güncellenecek İlçe {Guid.NewGuid()}");
        createContext.Districts.Add(district);
        await createContext.SaveChangesAsync();

        var editorService = Substitute.For<ICurrentUserService>();
        editorService.UserId.Returns(editorId);
        var editTimeProvider = Substitute.For<IDateTimeProvider>();
        editTimeProvider.UtcNow.Returns(updatedAt);

        await using var editContext = fixture.CreateContext(
            new AuditableEntitySaveChangesInterceptor(editorService, editTimeProvider));
        var toEdit = await editContext.Districts.FirstAsync(d => d.Id == district.Id);
        toEdit.Rename("Yeni İsim");
        await editContext.SaveChangesAsync();

        await using var verifyContext = fixture.CreateContext();
        var verified = await verifyContext.Districts.FirstAsync(d => d.Id == district.Id);
        verified.UpdatedAtUtc.Should().Be(updatedAt);
        verified.UpdatedBy.Should().Be(editorId.ToString());
        verified.CreatedBy.Should().Be(creatorId.ToString(), "güncelleme, orijinal oluşturan bilgisini değiştirmemelidir.");
    }

    [Fact]
    public async Task SavingChanges_WhenNoAuthenticatedUser_ShouldLeaveCreatedByNull()
    {
        var currentUserService = Substitute.For<ICurrentUserService>();
        currentUserService.UserId.Returns((Guid?)null);
        var dateTimeProvider = Substitute.For<IDateTimeProvider>();
        dateTimeProvider.UtcNow.Returns(DateTime.UtcNow);
        var interceptor = new AuditableEntitySaveChangesInterceptor(currentUserService, dateTimeProvider);

        await using var context = fixture.CreateContext(interceptor);
        var district = District.Create($"Anonim İlçe {Guid.NewGuid()}");
        context.Districts.Add(district);

        await context.SaveChangesAsync();

        district.CreatedBy.Should().BeNull();
    }
}
