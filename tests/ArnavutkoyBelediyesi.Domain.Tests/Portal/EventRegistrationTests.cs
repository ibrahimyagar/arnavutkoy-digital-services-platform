using ArnavutkoyBelediyesi.Domain.Portal;

namespace ArnavutkoyBelediyesi.Domain.Tests.Portal;

public sealed class EventRegistrationTests
{
    [Fact]
    public void Create_ThenCancel_ThenReactivate_Works()
    {
        var eventId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var first = new DateTime(2026, 8, 15, 12, 0, 0, DateTimeKind.Utc);
        var cancelled = first.AddHours(1);
        var again = cancelled.AddHours(2);

        var row = EventRegistration.Create(eventId, userId, first);
        row.Status.Should().Be(EventRegistrationStatus.Registered);
        row.CancelledAtUtc.Should().BeNull();

        row.Cancel(cancelled);
        row.Status.Should().Be(EventRegistrationStatus.Cancelled);
        row.CancelledAtUtc.Should().Be(cancelled);

        row.Reactivate(again);
        row.Status.Should().Be(EventRegistrationStatus.Registered);
        row.RegisteredAtUtc.Should().Be(again);
        row.CancelledAtUtc.Should().BeNull();
    }

    [Fact]
    public void Cancel_WhenAlreadyCancelled_Throws()
    {
        var row = EventRegistration.Create(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow);
        row.Cancel(DateTime.UtcNow);

        var act = () => row.Cancel(DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Reactivate_WhenActive_Throws()
    {
        var row = EventRegistration.Create(Guid.NewGuid(), Guid.NewGuid(), DateTime.UtcNow);
        var act = () => row.Reactivate(DateTime.UtcNow);
        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Create_WithEmptyIds_Throws()
    {
        var act = () => EventRegistration.Create(Guid.Empty, Guid.NewGuid(), DateTime.UtcNow);
        act.Should().Throw<ArgumentException>();
    }
}
