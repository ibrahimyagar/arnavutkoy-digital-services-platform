using ArnavutkoyBelediyesi.Domain.Notifications;

namespace ArnavutkoyBelediyesi.Domain.Tests.Notifications;

public sealed class NotificationLogTests
{
    [Fact]
    public void Create_WithValidData_ShouldStartAsPending()
    {
        var recipientId = Guid.NewGuid();

        var log = NotificationLog.Create(recipientId, NotificationChannel.InApp, "Konu", "Gövde metni");

        log.RecipientUserId.Should().Be(recipientId);
        log.Channel.Should().Be(NotificationChannel.InApp);
        log.Subject.Should().Be("Konu");
        log.Body.Should().Be("Gövde metni");
        log.Status.Should().Be(NotificationStatus.Pending);
        log.SentAtUtc.Should().BeNull();
        log.ErrorMessage.Should().BeEmpty();
    }

    [Fact]
    public void Create_WithEmptyRecipient_ShouldThrow()
    {
        var act = () => NotificationLog.Create(Guid.Empty, NotificationChannel.Email, "Konu", "Gövde");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void MarkSent_ShouldSetStatusAndTimestamp()
    {
        var log = NotificationLog.Create(Guid.NewGuid(), NotificationChannel.Email, "Konu", "Gövde");
        var sentAt = DateTime.UtcNow;

        log.MarkSent(sentAt);

        log.Status.Should().Be(NotificationStatus.Sent);
        log.SentAtUtc.Should().Be(sentAt);
        log.ErrorMessage.Should().BeEmpty();
    }

    [Fact]
    public void MarkFailed_ShouldSetStatusAndError()
    {
        var log = NotificationLog.Create(Guid.NewGuid(), NotificationChannel.Email, "Konu", "Gövde");

        log.MarkFailed("SMTP timeout");

        log.Status.Should().Be(NotificationStatus.Failed);
        log.SentAtUtc.Should().BeNull();
        log.ErrorMessage.Should().Be("SMTP timeout");
    }
}
