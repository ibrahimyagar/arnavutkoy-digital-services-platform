namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// Domain katmanında gerçekleşen ve dış katmanlara (Application/Infrastructure) bildirilmesi
/// gereken bir olayı temsil eder. Domain katmanı hiçbir dış bağımlılık içermediğinden bu arayüz
/// MediatR'ın <c>INotification</c> tipine bağlı değildir; dış katmanlarda bir adaptör aracılığıyla
/// mesajlaşma altyapısına (ör. MediatR) köprülenir.
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// Olayın gerçekleştiği UTC zaman damgası.
    /// </summary>
    DateTime OccurredOnUtc { get; }
}
