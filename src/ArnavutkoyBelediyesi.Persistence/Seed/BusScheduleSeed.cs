using ArnavutkoyBelediyesi.Domain.Transportation;

namespace ArnavutkoyBelediyesi.Persistence.Seed;

/// <summary>
/// Demo sefer saatleri — Ağustos 2026 yaz tarifesi (gerçek İETT verisi değildir).
/// Performans için temsilî saat setleri kullanılır; hafta içi Pazartesi şablonu diğer günler için geçerlidir.
/// </summary>
internal static class BusScheduleSeed
{
    internal sealed record Pattern(
        int WeekdayIntervalMinutes,
        int WeekendIntervalMinutes,
        TimeOnly WeekdayFirst,
        TimeOnly WeekdayLast,
        TimeOnly WeekendFirst,
        TimeOnly WeekendLast);

    internal static readonly Dictionary<string, Pattern> ByLineCode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["336"] = new(30, 45, new(5, 45), new(23, 15), new(6, 30), new(22, 30)),
        ["336M"] = new(30, 45, new(5, 50), new(23, 0), new(6, 30), new(22, 0)),
        ["336A"] = new(45, 60, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["336G"] = new(35, 50, new(6, 15), new(22, 45), new(7, 0), new(22, 0)),
        ["336H"] = new(35, 50, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["336K"] = new(50, 60, new(6, 30), new(21, 30), new(8, 0), new(20, 30)),
        ["36AS"] = new(30, 45, new(5, 40), new(23, 30), new(6, 30), new(22, 30)),
        ["36AY"] = new(30, 45, new(5, 45), new(23, 15), new(6, 30), new(22, 30)),
        ["36B"] = new(40, 55, new(6, 15), new(22, 0), new(7, 30), new(21, 0)),
        ["36CB"] = new(45, 60, new(6, 30), new(21, 30), new(8, 0), new(20, 30)),
        ["36D"] = new(40, 55, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["36HT"] = new(45, 60, new(6, 15), new(21, 45), new(7, 30), new(20, 30)),
        ["36Y"] = new(30, 45, new(5, 50), new(23, 0), new(6, 30), new(22, 0)),
        ["36YS"] = new(40, 55, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["MK22"] = new(35, 50, new(6, 30), new(22, 0), new(7, 30), new(21, 0)),
        ["HT18"] = new(40, 55, new(6, 15), new(22, 15), new(7, 30), new(21, 15)),
        ["H-6"] = new(45, 60, new(4, 30), new(23, 30), new(5, 0), new(23, 0)),
        ["418"] = new(40, 55, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["48KA"] = new(45, 60, new(6, 15), new(22, 0), new(7, 30), new(21, 0)),
        ["48M"] = new(50, 60, new(6, 30), new(21, 30), new(8, 0), new(20, 30)),
        ["144A"] = new(40, 55, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
        ["144B"] = new(45, 60, new(6, 15), new(22, 0), new(7, 30), new(21, 0)),
        ["144H"] = new(45, 60, new(6, 15), new(22, 0), new(7, 30), new(21, 0)),
        ["144K"] = new(50, 60, new(6, 30), new(21, 30), new(8, 0), new(20, 30)),
        ["144M"] = new(40, 55, new(6, 0), new(22, 30), new(7, 0), new(21, 30)),
    };

    internal static IReadOnlyList<BusLineDeparture> BuildForLine(Guid busLineId, string lineCode)
    {
        if (!ByLineCode.TryGetValue(lineCode, out var pattern))
        {
            pattern = new Pattern(45, 60, new(6, 30), new(22, 0), new(7, 30), new(21, 0));
        }

        var departures = new List<BusLineDeparture>();
        departures.AddRange(SlotRange(busLineId, DayOfWeek.Monday, pattern.WeekdayFirst, pattern.WeekdayLast, pattern.WeekdayIntervalMinutes));
        departures.AddRange(SlotRange(busLineId, DayOfWeek.Saturday, pattern.WeekendFirst, pattern.WeekendLast, pattern.WeekendIntervalMinutes));
        departures.AddRange(SlotRange(busLineId, DayOfWeek.Sunday, pattern.WeekendFirst, pattern.WeekendLast, pattern.WeekendIntervalMinutes));

        var today = DateTime.UtcNow.DayOfWeek;
        if (today is >= DayOfWeek.Monday and <= DayOfWeek.Friday and not DayOfWeek.Monday)
        {
            departures.AddRange(SlotRange(busLineId, today, pattern.WeekdayFirst, pattern.WeekdayLast, pattern.WeekdayIntervalMinutes));
        }

        return departures;
    }

    private static IEnumerable<BusLineDeparture> SlotRange(
        Guid busLineId,
        DayOfWeek day,
        TimeOnly first,
        TimeOnly last,
        int intervalMinutes)
    {
        if (intervalMinutes < 1 || first > last)
        {
            yield break;
        }

        // TimeOnly.AddMinutes gece yarısını aşınca MinValue'ya sarılır; naif `time <= last`
        // döngüsü sonsuza gider. Bu yüzden sarılmayı açıkça kesiyoruz.
        var time = first;
        while (true)
        {
            yield return BusLineDeparture.Create(busLineId, day, time, string.Empty);

            var nextTicks = time.Ticks + TimeSpan.FromMinutes(intervalMinutes).Ticks;
            if (nextTicks > TimeOnly.MaxValue.Ticks)
            {
                yield break;
            }

            var next = TimeOnly.FromTimeSpan(TimeSpan.FromTicks(nextTicks));
            if (next > last)
            {
                yield break;
            }

            time = next;
        }
    }
}
