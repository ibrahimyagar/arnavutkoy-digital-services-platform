using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.Transportation;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.Transportation;

public sealed class TransportCardTests
{
    [Fact]
    public void TopUp_And_ChargeFare_UpdatesBalance()
    {
        var card = TransportCard.Issue(Guid.NewGuid(), "TK-1001", 0);
        card.TopUp(50m);
        card.ChargeFare(17.50m);
        card.Balance.Should().Be(32.50m);
    }

    [Fact]
    public void ChargeFare_WhenInsufficient_Throws()
    {
        var card = TransportCard.Issue(Guid.NewGuid(), "TK-1002", 5m);
        var act = () => card.ChargeFare(17.50m);
        act.Should().Throw<InsufficientTransportBalanceException>();
    }
}

public sealed class BusLineTests
{
    [Fact]
    public void Create_NormalizesCode()
    {
        var line = BusLine.Create(" 36as ", "Hat", "A → B", 10m);
        line.Code.Should().Be("36AS");
    }
}
