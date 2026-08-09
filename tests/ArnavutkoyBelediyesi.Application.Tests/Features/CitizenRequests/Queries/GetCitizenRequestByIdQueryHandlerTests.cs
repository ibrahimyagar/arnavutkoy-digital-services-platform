using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.CitizenRequests.Queries;

public sealed class GetCitizenRequestByIdQueryHandlerTests
{
    private readonly ICitizenRequestRepository _repository = Substitute.For<ICitizenRequestRepository>();

    [Fact]
    public async Task Handle_WhenRequestNotFound_ShouldReturnFailure()
    {
        var requestId = Guid.NewGuid();
        _repository.GetByIdWithMessagesAsync(requestId, Arg.Any<CancellationToken>()).Returns((CitizenRequest?)null);
        var handler = new GetCitizenRequestByIdQueryHandler(_repository);

        var result = await handler.Handle(new GetCitizenRequestByIdQuery(requestId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenRequestFound_ShouldMapMessagesInChronologicalOrder()
    {
        var citizenId = Guid.NewGuid();
        var request = CitizenRequest.Create(citizenId, Guid.NewGuid(), "İlk mesaj");
        request.AddMessage(Guid.NewGuid(), SenderType.Officer, "İkinci mesaj");
        _repository.GetByIdWithMessagesAsync(request.Id, Arg.Any<CancellationToken>()).Returns(request);
        var handler = new GetCitizenRequestByIdQueryHandler(_repository);

        var result = await handler.Handle(new GetCitizenRequestByIdQuery(request.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.CitizenUserId.Should().Be(citizenId);
        result.Value.Messages.Should().HaveCount(2);
        result.Value.Messages.First().Message.Should().Be("İlk mesaj");
        result.Value.Messages.Last().Message.Should().Be("İkinci mesaj");
    }
}
