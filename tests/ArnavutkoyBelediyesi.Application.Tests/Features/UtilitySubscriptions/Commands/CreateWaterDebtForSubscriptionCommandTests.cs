using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Commands;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.UtilitySubscriptions.Commands;

public sealed class CreateWaterDebtForSubscriptionCommandTests
{
    [Fact]
    public async Task Handle_WhenSuspended_ShouldFail()
    {
        var subscription = WaterSubscription.Open(Guid.NewGuid(), Guid.NewGuid(), null, "AK-9", DateTime.UtcNow);
        subscription.Suspend();

        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repo = Substitute.For<IRepository<WaterSubscription>>();
        unitOfWork.Repository<WaterSubscription>().Returns(repo);
        repo.GetByIdAsync(subscription.Id, Arg.Any<CancellationToken>()).Returns(subscription);
        var handler = new CreateWaterDebtForSubscriptionCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreateWaterDebtForSubscriptionCommand(subscription.Id, 100m, DateTime.UtcNow.AddDays(30)),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenActive_ShouldCreateWaterDebt()
    {
        var subscription = WaterSubscription.Open(Guid.NewGuid(), Guid.NewGuid(), null, "AK-10", DateTime.UtcNow);
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var subRepo = Substitute.For<IRepository<WaterSubscription>>();
        var debtRepo = Substitute.For<IRepository<Debt>>();
        unitOfWork.Repository<WaterSubscription>().Returns(subRepo);
        unitOfWork.Repository<Debt>().Returns(debtRepo);
        subRepo.GetByIdAsync(subscription.Id, Arg.Any<CancellationToken>()).Returns(subscription);
        var handler = new CreateWaterDebtForSubscriptionCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreateWaterDebtForSubscriptionCommand(subscription.Id, 250.50m, DateTime.UtcNow.AddDays(15)),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await debtRepo.Received(1).AddAsync(
            Arg.Is<Debt>(d => d.Type == DebtType.Water && d.DebtorUserId == subscription.SubscriberUserId),
            Arg.Any<CancellationToken>());
    }
}
