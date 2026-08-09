using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation.TestHelper;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Announcements.Commands;

public sealed class CreateAnnouncementCommandValidatorTests
{
    private readonly CreateAnnouncementCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_ShouldNotHaveErrors()
    {
        var result = _validator.TestValidate(new CreateAnnouncementCommand("Başlık", "İçerik", null));

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithPastPublishEndUtc_ShouldHaveError()
    {
        var command = new CreateAnnouncementCommand("Başlık", "İçerik", DateTime.UtcNow.AddDays(-1));

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PublishEndUtc);
    }

    [Fact]
    public void Validate_WithFuturePublishEndUtc_ShouldNotHaveError()
    {
        var command = new CreateAnnouncementCommand("Başlık", "İçerik", DateTime.UtcNow.AddDays(1));

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.PublishEndUtc);
    }
}

public sealed class CreateAnnouncementCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldPersistDraftAnnouncementAndReturnItsId()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repository = Substitute.For<IRepository<Announcement>>();
        unitOfWork.Repository<Announcement>().Returns(repository);
        var handler = new CreateAnnouncementCommandHandler(unitOfWork);

        var result = await handler.Handle(new CreateAnnouncementCommand("Başlık", "İçerik", null), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await repository.Received(1).AddAsync(Arg.Any<Announcement>(), Arg.Any<CancellationToken>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public sealed class PublishAnnouncementCommandHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<Announcement> _repository = Substitute.For<IRepository<Announcement>>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();

    private PublishAnnouncementCommandHandler CreateHandler()
    {
        _unitOfWork.Repository<Announcement>().Returns(_repository);
        return new PublishAnnouncementCommandHandler(_unitOfWork, _dateTimeProvider);
    }

    [Fact]
    public async Task Handle_WhenAnnouncementNotFound_ShouldReturnFailure()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Announcement?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(new PublishAnnouncementCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenDraft_ShouldPublishSuccessfully()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        var now = new DateTime(2026, 6, 1, 9, 0, 0, DateTimeKind.Utc);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        _dateTimeProvider.UtcNow.Returns(now);
        var handler = CreateHandler();

        var result = await handler.Handle(new PublishAnnouncementCommand(announcement.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        announcement.Status.Should().Be(AnnouncementStatus.Published);
        announcement.PublishStartUtc.Should().Be(now);
    }

    [Fact]
    public async Task Handle_WhenAlreadyArchived_ShouldReturnFailureWithoutThrowing()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);
        announcement.Archive();
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(new PublishAnnouncementCommand(announcement.Id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}

public sealed class UpdateAnnouncementCommandHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<Announcement> _repository = Substitute.For<IRepository<Announcement>>();

    private UpdateAnnouncementCommandHandler CreateHandler()
    {
        _unitOfWork.Repository<Announcement>().Returns(_repository);
        return new UpdateAnnouncementCommandHandler(_unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenDraft_ShouldUpdateContent()
    {
        var announcement = Announcement.CreateDraft("Eski", "Eski İçerik", null);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new UpdateAnnouncementCommand(announcement.Id, "Yeni", "Yeni İçerik"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        announcement.Title.Should().Be("Yeni");
        announcement.Content.Should().Be("Yeni İçerik");
    }

    [Fact]
    public async Task Handle_WhenPublished_ShouldReturnFailureWithoutThrowing()
    {
        var announcement = Announcement.CreateDraft("Eski", "Eski İçerik", null);
        announcement.Publish(DateTime.UtcNow);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new UpdateAnnouncementCommand(announcement.Id, "Yeni", "Yeni İçerik"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}

public sealed class ArchiveAnnouncementCommandHandlerTests
{
    [Fact]
    public async Task Handle_WhenPublished_ShouldArchiveSuccessfully()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repository = Substitute.For<IRepository<Announcement>>();
        unitOfWork.Repository<Announcement>().Returns(repository);
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);
        repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = new ArchiveAnnouncementCommandHandler(unitOfWork);

        var result = await handler.Handle(new ArchiveAnnouncementCommand(announcement.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        announcement.Status.Should().Be(AnnouncementStatus.Archived);
    }

    [Fact]
    public async Task Handle_WhenAnnouncementNotFound_ShouldReturnFailure()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repository = Substitute.For<IRepository<Announcement>>();
        unitOfWork.Repository<Announcement>().Returns(repository);
        var id = Guid.NewGuid();
        repository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Announcement?)null);
        var handler = new ArchiveAnnouncementCommandHandler(unitOfWork);

        var result = await handler.Handle(new ArchiveAnnouncementCommand(id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}
