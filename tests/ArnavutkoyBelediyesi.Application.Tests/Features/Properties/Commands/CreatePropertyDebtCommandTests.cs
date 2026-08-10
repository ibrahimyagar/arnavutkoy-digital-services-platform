using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Properties.Commands;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.Properties;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Properties.Commands;

public sealed class CreatePropertyDebtCommandTests
{
    [Fact]
    public async Task Handle_WhenInactive_ShouldFail()
    {
        var property = CitizenProperty.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            PropertyType.Residential,
            "Pasif Konut",
            "1",
            "1/1");
        property.Deactivate();

        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repo = Substitute.For<IRepository<CitizenProperty>>();
        unitOfWork.Repository<CitizenProperty>().Returns(repo);
        repo.GetByIdAsync(property.Id, Arg.Any<CancellationToken>()).Returns(property);
        var handler = new CreatePropertyDebtCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreatePropertyDebtCommand(property.Id, 500m, DateTime.UtcNow.AddDays(30)),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenActive_ShouldCreatePropertyDebt()
    {
        var property = CitizenProperty.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            PropertyType.Commercial,
            "İşyeri",
            "5",
            "10/2");

        var unitOfWork = Substitute.For<IUnitOfWork>();
        var propertyRepo = Substitute.For<IRepository<CitizenProperty>>();
        var debtRepo = Substitute.For<IRepository<Debt>>();
        unitOfWork.Repository<CitizenProperty>().Returns(propertyRepo);
        unitOfWork.Repository<Debt>().Returns(debtRepo);
        propertyRepo.GetByIdAsync(property.Id, Arg.Any<CancellationToken>()).Returns(property);
        var handler = new CreatePropertyDebtCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreatePropertyDebtCommand(property.Id, 1780m, DateTime.UtcNow.AddDays(20)),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await debtRepo.Received(1).AddAsync(
            Arg.Is<Debt>(d => d.Type == DebtType.Property && d.DebtorUserId == property.OwnerUserId),
            Arg.Any<CancellationToken>());
    }
}
