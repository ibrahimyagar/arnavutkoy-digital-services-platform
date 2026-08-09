using ArnavutkoyBelediyesi.Application.Common.Interfaces;

namespace ArnavutkoyBelediyesi.Infrastructure.Services;

/// <summary>
/// <see cref="IDateTimeProvider"/>'ın sistem saatine dayalı üretim (production) implementasyonu.
/// </summary>
public sealed class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
