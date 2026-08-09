namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// Tüm domain entity'leri için kimlik ve domain olayı biriktirme davranışını sağlayan taban sınıf.
/// </summary>
public abstract class Entity
{
    private readonly List<IDomainEvent> _domainEvents = [];

    /// <summary>
    /// Entity'nin birincil anahtarı.
    /// </summary>
    public Guid Id { get; protected init; } = Guid.NewGuid();

    /// <summary>
    /// Entity üzerinde henüz dağıtılmamış domain olaylarının salt okunur listesi.
    /// </summary>
    public IReadOnlyCollection<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();

    /// <summary>
    /// Bir domain olayını, kalıcı hale getirildikten sonra dış katmanlara bildirilmek üzere kaydeder.
    /// </summary>
    /// <param name="domainEvent">Kaydedilecek domain olayı.</param>
    protected void RaiseDomainEvent(IDomainEvent domainEvent) => _domainEvents.Add(domainEvent);

    /// <summary>
    /// Dağıtılan domain olaylarını temizler. Persistence katmanında SaveChanges sonrasında çağrılır.
    /// </summary>
    public void ClearDomainEvents() => _domainEvents.Clear();

    public override bool Equals(object? obj)
    {
        if (obj is not Entity other)
        {
            return false;
        }

        if (ReferenceEquals(this, other))
        {
            return true;
        }

        return GetType() == other.GetType() && Id == other.Id;
    }

    public override int GetHashCode() => HashCode.Combine(GetType(), Id);
}
