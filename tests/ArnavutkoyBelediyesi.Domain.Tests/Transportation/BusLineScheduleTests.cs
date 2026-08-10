using ArnavutkoyBelediyesi.Domain.Transportation;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.Transportation;

public sealed class BusLineScheduleTests
{
    [Fact]
    public void BusLineStop_Create_RequiresPositiveSequence()
    {
        var act = () => BusLineStop.Create(Guid.NewGuid(), 0, "Durak");
        act.Should().Throw<ArgumentOutOfRangeException>().WithParameterName("sequence");
    }

    [Fact]
    public void BusLineDeparture_Create_StoresTime()
    {
        var lineId = Guid.NewGuid();
        var departure = BusLineDeparture.Create(lineId, DayOfWeek.Friday, new TimeOnly(17, 45), "Akşam");

        departure.BusLineId.Should().Be(lineId);
        departure.DepartureTime.Should().Be(new TimeOnly(17, 45));
        departure.Note.Should().Be("Akşam");
    }
}
