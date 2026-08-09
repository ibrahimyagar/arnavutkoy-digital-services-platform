using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Persistence.Interceptors;
using MediatR;

namespace ArnavutkoyBelediyesi.Infrastructure.Tests.Interceptors;

/// <summary>
/// <see cref="DispatchDomainEventsInterceptor"/>'ın, yalnızca değişiklikler kalıcı hâle geldikten
/// SONRA domain olaylarını yayınladığını ve entity üzerindeki olay listesini temizlediğini doğrular.
/// </summary>
[Collection(DatabaseCollection.Name)]
public sealed class DispatchDomainEventsInterceptorTests(PostgreSqlFixture fixture)
{
    [Fact]
    public async Task SavedChangesAsync_ShouldPublishDomainEventsRaisedDuringTheUnitOfWork()
    {
        var publisher = Substitute.For<IPublisher>();
        var interceptor = new DispatchDomainEventsInterceptor(publisher);

        await using var context = fixture.CreateContext(interceptor);
        var category = RequestCategory.Create($"Kategori {Guid.NewGuid()}");
        context.RequestCategories.Add(category);
        await context.SaveChangesAsync();

        var citizenId = Guid.NewGuid();
        var request = CitizenRequest.Create(citizenId, category.Id, "İlk mesaj");
        context.CitizenRequests.Add(request);

        await context.SaveChangesAsync();

        await publisher.Received(1).Publish(
            Arg.Is<DomainEventNotification<CitizenRequestCreatedDomainEvent>>(
                n => n.DomainEvent.CitizenUserId == citizenId),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task SavedChangesAsync_ShouldClearDomainEventsFromEntityAfterDispatch()
    {
        var publisher = Substitute.For<IPublisher>();
        var interceptor = new DispatchDomainEventsInterceptor(publisher);

        await using var context = fixture.CreateContext(interceptor);
        var category = RequestCategory.Create($"Kategori {Guid.NewGuid()}");
        context.RequestCategories.Add(category);
        await context.SaveChangesAsync();

        var request = CitizenRequest.Create(Guid.NewGuid(), category.Id, "İlk mesaj");
        context.CitizenRequests.Add(request);
        await context.SaveChangesAsync();

        request.DomainEvents.Should().BeEmpty();
    }

    [Fact]
    public async Task SavedChangesAsync_WhenNoDomainEventsRaised_ShouldNotPublishAnything()
    {
        var publisher = Substitute.For<IPublisher>();
        var interceptor = new DispatchDomainEventsInterceptor(publisher);

        await using var context = fixture.CreateContext(interceptor);
        var category = RequestCategory.Create($"Sessiz Kategori {Guid.NewGuid()}");
        context.RequestCategories.Add(category);

        await context.SaveChangesAsync();

        await publisher.DidNotReceive().Publish(Arg.Any<INotification>(), Arg.Any<CancellationToken>());
    }
}
