using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Transportation.Commands;
using ArnavutkoyBelediyesi.Domain.Transportation;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Transportation.Commands;

public sealed class BoardBusCommandTests
{
    [Fact]
    public async Task Handle_WhenBalanceEnough_CreatesBoarding()
    {
        var card = TransportCard.Issue(Guid.NewGuid(), "TK-9", 100m);
        var line = BusLine.Create("36AS", "Hat", "A-B", 17.50m);
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var cardRepo = Substitute.For<IRepository<TransportCard>>();
        var lineRepo = Substitute.For<IRepository<BusLine>>();
        var boardingRepo = Substitute.For<IRepository<BoardingRecord>>();
        var clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(DateTime.UtcNow);
        unitOfWork.Repository<TransportCard>().Returns(cardRepo);
        unitOfWork.Repository<BusLine>().Returns(lineRepo);
        unitOfWork.Repository<BoardingRecord>().Returns(boardingRepo);
        cardRepo.GetByIdAsync(card.Id, Arg.Any<CancellationToken>()).Returns(card);
        lineRepo.GetByIdAsync(line.Id, Arg.Any<CancellationToken>()).Returns(line);
        var handler = new BoardBusCommandHandler(unitOfWork, clock);

        var result = await handler.Handle(new BoardBusCommand(card.Id, line.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        card.Balance.Should().Be(82.50m);
        await boardingRepo.Received(1).AddAsync(Arg.Any<BoardingRecord>(), Arg.Any<CancellationToken>());
    }
}
