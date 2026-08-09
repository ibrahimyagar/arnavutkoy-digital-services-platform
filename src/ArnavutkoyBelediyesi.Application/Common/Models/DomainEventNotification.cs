using ArnavutkoyBelediyesi.Domain.Common;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Common.Models;

/// <summary>
/// Domain katmanındaki bağımlılıksız <see cref="IDomainEvent"/> tipini, MediatR'ın mesajlaşma
/// altyapısına köprüleyen adaptör. Domain katmanı bu sayede MediatR'a bağımlı olmaz.
/// </summary>
/// <typeparam name="TDomainEvent">Sarmalanan domain olayının tipi.</typeparam>
public sealed class DomainEventNotification<TDomainEvent>(TDomainEvent domainEvent) : INotification
    where TDomainEvent : IDomainEvent
{
    /// <summary>
    /// Sarmalanan domain olayı.
    /// </summary>
    public TDomainEvent DomainEvent { get; } = domainEvent;
}
