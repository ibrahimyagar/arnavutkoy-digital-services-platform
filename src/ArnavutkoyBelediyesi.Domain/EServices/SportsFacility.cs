using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.EServices;

public sealed class SportsFacility : AuditableEntity
{
    private SportsFacility()
    {
        Name = string.Empty;
        Address = string.Empty;
        ActivityType = string.Empty;
    }

    public string Name { get; private set; }
    public string Address { get; private set; }
    public string ActivityType { get; private set; }
    public int CapacityPerSlot { get; private set; }
    public bool IsActive { get; private set; }

    public static SportsFacility Create(string name, string address, string activityType, int capacityPerSlot)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        ArgumentException.ThrowIfNullOrWhiteSpace(activityType);
        if (capacityPerSlot < 1)
        {
            throw new ArgumentOutOfRangeException(nameof(capacityPerSlot));
        }

        return new SportsFacility
        {
            Name = name.Trim(),
            Address = address.Trim(),
            ActivityType = activityType.Trim(),
            CapacityPerSlot = capacityPerSlot,
            IsActive = true,
        };
    }
}
