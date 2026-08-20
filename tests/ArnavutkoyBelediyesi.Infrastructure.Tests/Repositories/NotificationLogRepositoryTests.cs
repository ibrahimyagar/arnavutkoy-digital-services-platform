using ArnavutkoyBelediyesi.Domain.Notifications;
using ArnavutkoyBelediyesi.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Repositories;

[Collection(DatabaseCollection.Name)]
public sealed class NotificationLogRepositoryTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task AddAsync_ThenQuery_ShouldReturnPersistedNotificationLog()
    {
        await using var context = fixture.CreateContext();
        var repository = new Repository<NotificationLog>(context);
        var recipientId = Guid.NewGuid();
        var log = NotificationLog.Create(recipientId, NotificationChannel.InApp, "Test", "Gövde");
        log.MarkSent(DateTime.UtcNow);

        await repository.AddAsync(log);
        await context.SaveChangesAsync();

        await using var readContext = fixture.CreateContext();
        var found = await readContext.NotificationLogs.AsNoTracking().FirstOrDefaultAsync(n => n.Id == log.Id);

        found.Should().NotBeNull();
        found!.RecipientUserId.Should().Be(recipientId);
        found.Status.Should().Be(NotificationStatus.Sent);
        found.Subject.Should().Be("Test");
    }
}
