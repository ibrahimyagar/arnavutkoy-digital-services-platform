using ArnavutkoyBelediyesi.Persistence.Repositories;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Repositories;

/// <summary>
/// <see cref="RefreshTokenRepository"/>'nin ekleme, aktif token arama ve iptal (rotasyon)
/// davranışlarını gerçek bir PostgreSQL örneğine karşı doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class RefreshTokenRepositoryTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task AddAsync_ThenFindActiveAsync_ShouldReturnTheStoredToken()
    {
        var userId = Guid.NewGuid();
        var tokenHash = Guid.NewGuid().ToString();
        var expiresAt = DateTime.UtcNow.AddDays(7);

        await using var writeContext = fixture.CreateContext();
        var repository = new RefreshTokenRepository(writeContext);
        await repository.AddAsync(userId, tokenHash, expiresAt);

        await using var readContext = fixture.CreateContext();
        var readRepository = new RefreshTokenRepository(readContext);
        var found = await readRepository.FindActiveAsync(tokenHash);

        found.Should().NotBeNull();
        found!.UserId.Should().Be(userId);
        found.IsRevoked.Should().BeFalse();
    }

    [Fact]
    public async Task FindActiveAsync_WhenTokenDoesNotExist_ShouldReturnNull()
    {
        await using var context = fixture.CreateContext();
        var repository = new RefreshTokenRepository(context);

        var found = await repository.FindActiveAsync(Guid.NewGuid().ToString());

        found.Should().BeNull();
    }

    [Fact]
    public async Task RevokeAsync_ShouldMarkTokenAsRevoked()
    {
        var tokenHash = Guid.NewGuid().ToString();

        await using var writeContext = fixture.CreateContext();
        var repository = new RefreshTokenRepository(writeContext);
        await repository.AddAsync(Guid.NewGuid(), tokenHash, DateTime.UtcNow.AddDays(7));

        await using var revokeContext = fixture.CreateContext();
        var revokeRepository = new RefreshTokenRepository(revokeContext);
        await revokeRepository.RevokeAsync(tokenHash);

        await using var readContext = fixture.CreateContext();
        var readRepository = new RefreshTokenRepository(readContext);
        var found = await readRepository.FindActiveAsync(tokenHash);

        found!.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public async Task RevokeAsync_WhenTokenDoesNotExist_ShouldNotThrow()
    {
        await using var context = fixture.CreateContext();
        var repository = new RefreshTokenRepository(context);

        var act = async () => await repository.RevokeAsync(Guid.NewGuid().ToString());

        await act.Should().NotThrowAsync();
    }
}
