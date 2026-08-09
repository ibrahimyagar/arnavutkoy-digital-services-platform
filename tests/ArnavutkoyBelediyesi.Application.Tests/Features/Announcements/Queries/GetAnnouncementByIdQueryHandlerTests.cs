using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Queries;
using ArnavutkoyBelediyesi.Domain.Announcements;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Announcements.Queries;

public sealed class GetAnnouncementByIdQueryHandlerTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<Announcement> _repository = Substitute.For<IRepository<Announcement>>();

    private GetAnnouncementByIdQueryHandler CreateHandler()
    {
        _unitOfWork.Repository<Announcement>().Returns(_repository);
        return new GetAnnouncementByIdQueryHandler(_unitOfWork);
    }

    [Fact]
    public async Task Handle_WhenAnnouncementNotFound_ShouldReturnFailure()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((Announcement?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(new GetAnnouncementByIdQuery(id, IncludeUnpublished: false), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenDraftAndIncludeUnpublishedIsFalse_ShouldReturnNotFound()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(new GetAnnouncementByIdQuery(announcement.Id, IncludeUnpublished: false), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenDraftAndIncludeUnpublishedIsTrue_ShouldReturnAnnouncement()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(new GetAnnouncementByIdQuery(announcement.Id, IncludeUnpublished: true), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.Status.Should().Be(AnnouncementStatus.Draft);
    }

    [Fact]
    public async Task Handle_WhenPublishedAndIncludeUnpublishedIsFalse_ShouldReturnAnnouncement()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);
        _repository.GetByIdAsync(announcement.Id, Arg.Any<CancellationToken>()).Returns(announcement);
        var handler = CreateHandler();

        var result = await handler.Handle(new GetAnnouncementByIdQuery(announcement.Id, IncludeUnpublished: false), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}
