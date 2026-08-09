using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.CitizenRequests.Commands;

/// <summary>
/// <see cref="MarkRequestUnderReviewCommandHandler"/>, <see cref="ResolveRequestCommandHandler"/>
/// ve <see cref="CloseRequestCommandHandler"/> için ortak durum geçişi senaryolarını doğrular.
/// </summary>
public sealed class CitizenRequestStatusCommandsTests
{
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<CitizenRequest> _repository = Substitute.For<IRepository<CitizenRequest>>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();

    private static CitizenRequest CreatePendingRequest() =>
        CitizenRequest.Create(Guid.NewGuid(), Guid.NewGuid(), "İlk mesaj");

    [Fact]
    public async Task MarkUnderReview_WhenRequestNotFound_ShouldReturnFailure()
    {
        var requestId = Guid.NewGuid();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(requestId, Arg.Any<CancellationToken>()).Returns((CitizenRequest?)null);
        var handler = new MarkRequestUnderReviewCommandHandler(_unitOfWork);

        var result = await handler.Handle(new MarkRequestUnderReviewCommand(requestId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task MarkUnderReview_WhenPending_ShouldSucceedAndPersist()
    {
        var request = CreatePendingRequest();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = new MarkRequestUnderReviewCommandHandler(_unitOfWork);

        var result = await handler.Handle(new MarkRequestUnderReviewCommand(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        request.Status.Should().Be(RequestStatus.UnderReview);
        _repository.Received(1).Update(request);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task MarkUnderReview_WhenAlreadyClosed_ShouldReturnFailureWithoutThrowing()
    {
        var request = CreatePendingRequest();
        request.Close();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = new MarkRequestUnderReviewCommandHandler(_unitOfWork);

        var result = await handler.Handle(new MarkRequestUnderReviewCommand(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Resolve_WhenPending_ShouldSucceedAndSetResolvedAtUtc()
    {
        var request = CreatePendingRequest();
        var now = new DateTime(2026, 5, 1, 10, 0, 0, DateTimeKind.Utc);
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        _dateTimeProvider.UtcNow.Returns(now);
        var handler = new ResolveRequestCommandHandler(_unitOfWork, _dateTimeProvider);

        var result = await handler.Handle(new ResolveRequestCommand(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        request.Status.Should().Be(RequestStatus.Resolved);
        request.ResolvedAtUtc.Should().Be(now);
    }

    [Fact]
    public async Task Resolve_WhenRequestNotFound_ShouldReturnFailure()
    {
        var requestId = Guid.NewGuid();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(requestId, Arg.Any<CancellationToken>()).Returns((CitizenRequest?)null);
        var handler = new ResolveRequestCommandHandler(_unitOfWork, _dateTimeProvider);

        var result = await handler.Handle(new ResolveRequestCommand(requestId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Close_WhenNotYetClosed_ShouldSucceed()
    {
        var request = CreatePendingRequest();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = new CloseRequestCommandHandler(_unitOfWork);

        var result = await handler.Handle(new CloseRequestCommand(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        request.Status.Should().Be(RequestStatus.Closed);
    }

    [Fact]
    public async Task Close_WhenAlreadyClosed_ShouldReturnFailure()
    {
        var request = CreatePendingRequest();
        request.Close();
        _unitOfWork.Repository<CitizenRequest>().Returns(_repository);
        _repository.GetByIdAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = new CloseRequestCommandHandler(_unitOfWork);

        var result = await handler.Handle(new CloseRequestCommand(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }
}
