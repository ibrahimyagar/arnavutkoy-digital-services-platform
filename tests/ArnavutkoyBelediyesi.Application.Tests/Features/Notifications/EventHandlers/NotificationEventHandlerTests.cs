using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Notifications.EventHandlers;
using ArnavutkoyBelediyesi.Domain.Announcements.Events;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Domain.Notifications;
using Microsoft.Extensions.Logging;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Notifications.EventHandlers;

public sealed class CitizenRequestResolvedNotificationHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<NotificationLog> _repository = Substitute.For<IRepository<NotificationLog>>();
    private readonly INotificationSender _sender = Substitute.For<INotificationSender>();
    private readonly IDateTimeProvider _clock = Substitute.For<IDateTimeProvider>();
    private readonly ILogger<CitizenRequestResolvedNotificationHandler> _logger =
        Substitute.For<ILogger<CitizenRequestResolvedNotificationHandler>>();

    public CitizenRequestResolvedNotificationHandlerTests()
    {
        _unitOfWork.Repository<NotificationLog>().Returns(_repository);
        _sender.Channel.Returns(NotificationChannel.InApp);
        _clock.UtcNow.Returns(new DateTime(2026, 8, 20, 12, 0, 0, DateTimeKind.Utc));
    }

    private CitizenRequestResolvedNotificationHandler CreateHandler() =>
        new(_unitOfWork, [_sender], _clock, _logger);

    [Fact]
    public async Task Handle_WhenResolved_ShouldCreateLogAndMarkSent()
    {
        NotificationLog? captured = null;
        _repository.AddAsync(Arg.Any<NotificationLog>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                captured = call.Arg<NotificationLog>();
                return Task.CompletedTask;
            });

        var domainEvent = new CitizenRequestResolvedDomainEvent(Guid.NewGuid(), Guid.NewGuid(), RequestStatus.Resolved);
        var handler = CreateHandler();

        await handler.Handle(new DomainEventNotification<CitizenRequestResolvedDomainEvent>(domainEvent), CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RecipientUserId.Should().Be(domainEvent.CitizenUserId);
        captured.Status.Should().Be(NotificationStatus.Sent);
        await _sender.Received(1).SendAsync(
            domainEvent.CitizenUserId,
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenSenderFails_ShouldMarkFailed()
    {
        NotificationLog? captured = null;
        _repository.AddAsync(Arg.Any<NotificationLog>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                captured = call.Arg<NotificationLog>();
                return Task.CompletedTask;
            });
        _sender.SendAsync(Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<string>(), Arg.Any<CancellationToken>())
            .Returns<Task>(_ => throw new InvalidOperationException("Kanal hatası"));

        var domainEvent = new CitizenRequestResolvedDomainEvent(Guid.NewGuid(), Guid.NewGuid(), RequestStatus.Closed);
        var handler = CreateHandler();

        await handler.Handle(new DomainEventNotification<CitizenRequestResolvedDomainEvent>(domainEvent), CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.Status.Should().Be(NotificationStatus.Failed);
        captured.ErrorMessage.Should().Contain("Kanal hatası");
    }
}

public sealed class RequestMessageAddedNotificationHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<NotificationLog> _repository = Substitute.For<IRepository<NotificationLog>>();
    private readonly INotificationSender _sender = Substitute.For<INotificationSender>();
    private readonly IDateTimeProvider _clock = Substitute.For<IDateTimeProvider>();
    private readonly ILogger<RequestMessageAddedNotificationHandler> _logger =
        Substitute.For<ILogger<RequestMessageAddedNotificationHandler>>();

    public RequestMessageAddedNotificationHandlerTests()
    {
        _unitOfWork.Repository<NotificationLog>().Returns(_repository);
        _sender.Channel.Returns(NotificationChannel.InApp);
        _clock.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_WhenCitizenSender_ShouldNotCreateNotification()
    {
        var handler = new RequestMessageAddedNotificationHandler(_unitOfWork, [_sender], _clock, _logger);
        var domainEvent = new RequestMessageAddedDomainEvent(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), SenderType.Citizen, "Vatandaş mesajı");

        await handler.Handle(new DomainEventNotification<RequestMessageAddedDomainEvent>(domainEvent), CancellationToken.None);

        await _repository.DidNotReceive().AddAsync(Arg.Any<NotificationLog>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenOfficerSender_ShouldCreateNotification()
    {
        NotificationLog? captured = null;
        _repository.AddAsync(Arg.Any<NotificationLog>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                captured = call.Arg<NotificationLog>();
                return Task.CompletedTask;
            });

        var citizenId = Guid.NewGuid();
        var handler = new RequestMessageAddedNotificationHandler(_unitOfWork, [_sender], _clock, _logger);
        var domainEvent = new RequestMessageAddedDomainEvent(
            Guid.NewGuid(), citizenId, Guid.NewGuid(), SenderType.Officer, "İnceleme sonucu");

        await handler.Handle(new DomainEventNotification<RequestMessageAddedDomainEvent>(domainEvent), CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RecipientUserId.Should().Be(citizenId);
        captured.Status.Should().Be(NotificationStatus.Sent);
    }
}

public sealed class AnnouncementPublishedNotificationHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<NotificationLog> _repository = Substitute.For<IRepository<NotificationLog>>();
    private readonly INotificationSender _sender = Substitute.For<INotificationSender>();
    private readonly IDateTimeProvider _clock = Substitute.For<IDateTimeProvider>();
    private readonly ILogger<AnnouncementPublishedNotificationHandler> _logger =
        Substitute.For<ILogger<AnnouncementPublishedNotificationHandler>>();

    public AnnouncementPublishedNotificationHandlerTests()
    {
        _unitOfWork.Repository<NotificationLog>().Returns(_repository);
        _sender.Channel.Returns(NotificationChannel.InApp);
        _clock.UtcNow.Returns(DateTime.UtcNow);
    }

    [Fact]
    public async Task Handle_WhenPublished_ShouldCreateBroadcastNotification()
    {
        NotificationLog? captured = null;
        _repository.AddAsync(Arg.Any<NotificationLog>(), Arg.Any<CancellationToken>())
            .Returns(call =>
            {
                captured = call.Arg<NotificationLog>();
                return Task.CompletedTask;
            });

        var handler = new AnnouncementPublishedNotificationHandler(_unitOfWork, [_sender], _clock, _logger);
        var domainEvent = new AnnouncementPublishedDomainEvent(Guid.NewGuid(), "Su kesintisi");

        await handler.Handle(new DomainEventNotification<AnnouncementPublishedDomainEvent>(domainEvent), CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.RecipientUserId.Should().Be(NotificationLog.BroadcastRecipientId);
        captured.Subject.Should().Contain("duyuru");
        captured.Status.Should().Be(NotificationStatus.Sent);
    }
}
