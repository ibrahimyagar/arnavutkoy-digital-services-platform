using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.CitizenRequests.Commands;

public sealed class AddRequestMessageCommandHandlerTests
{
    private readonly ICitizenRequestRepository _repository = Substitute.For<ICitizenRequestRepository>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();

    private AddRequestMessageCommandHandler CreateHandler() => new(_repository, _unitOfWork);

    [Fact]
    public async Task Handle_WhenRequestNotFound_ShouldReturnFailure()
    {
        var requestId = Guid.NewGuid();
        _repository.GetByIdWithMessagesAsync(requestId, Arg.Any<CancellationToken>()).Returns((CitizenRequest?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new AddRequestMessageCommand(requestId, Guid.NewGuid(), SenderType.Officer, "Mesaj"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenRequestClosed_ShouldReturnFailureWithoutThrowing()
    {
        var request = CitizenRequest.Create(Guid.NewGuid(), Guid.NewGuid(), "İlk mesaj");
        request.Close();
        _repository.GetByIdWithMessagesAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = CreateHandler();

        var result = await handler.Handle(
            new AddRequestMessageCommand(request.Id, Guid.NewGuid(), SenderType.Officer, "Çok geç"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenRequestOpen_ShouldAppendMessageAndPersist()
    {
        var request = CitizenRequest.Create(Guid.NewGuid(), Guid.NewGuid(), "İlk mesaj");
        _repository.GetByIdWithMessagesAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = CreateHandler();
        var officerId = Guid.NewGuid();

        var result = await handler.Handle(
            new AddRequestMessageCommand(request.Id, officerId, SenderType.Officer, "İnceleniyor"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        request.Messages.Should().HaveCount(2);
        _repository.Received(1).Update(request);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
