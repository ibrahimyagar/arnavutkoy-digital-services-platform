using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.UtilitySubscriptions;

public sealed class WaterSubscriptionTests
{
    [Fact]
    public void Open_CreatesActiveSubscription()
    {
        var sub = WaterSubscription.Open(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            "  ak-1001  ",
            DateTime.UtcNow);

        sub.SubscriptionNumber.Should().Be("AK-1001");
        sub.Status.Should().Be(WaterSubscriptionStatus.Active);
        sub.CanGenerateDebt.Should().BeTrue();
    }

    [Fact]
    public void Suspend_ThenReactivate_Works()
    {
        var sub = WaterSubscription.Open(Guid.NewGuid(), Guid.NewGuid(), null, "AK-1", DateTime.UtcNow);

        sub.Suspend();
        sub.Status.Should().Be(WaterSubscriptionStatus.Suspended);
        sub.CanGenerateDebt.Should().BeFalse();

        sub.Reactivate();
        sub.Status.Should().Be(WaterSubscriptionStatus.Active);
    }

    [Fact]
    public void Close_PreventsFurtherChanges()
    {
        var sub = WaterSubscription.Open(Guid.NewGuid(), Guid.NewGuid(), null, "AK-2", DateTime.UtcNow);
        sub.Close(DateTime.UtcNow);

        var act = () => sub.Suspend();
        act.Should().Throw<InvalidWaterSubscriptionStateException>();
    }

    [Fact]
    public void Suspend_WhenAlreadySuspended_Throws()
    {
        var sub = WaterSubscription.Open(Guid.NewGuid(), Guid.NewGuid(), null, "AK-3", DateTime.UtcNow);
        sub.Suspend();

        var act = () => sub.Suspend();
        act.Should().Throw<InvalidWaterSubscriptionStateException>();
    }
}
