using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Properties.Commands;
using ArnavutkoyBelediyesi.Domain.Geography;
using ArnavutkoyBelediyesi.Domain.Properties;
using FluentValidation.TestHelper;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Properties.Commands;

public sealed class RegisterCitizenPropertyCommandTests
{
    private readonly RegisterCitizenPropertyCommandValidator _validator = new();

    private static RegisterCitizenPropertyCommand ValidCommand(Guid neighborhoodId, Guid? streetId = null) =>
        new(Guid.NewGuid(), neighborhoodId, streetId, PropertyType.Residential, "Konut", "12", "1/1");

    [Fact]
    public void Validate_WithBlankTitle_ShouldHaveError()
    {
        var result = _validator.TestValidate(ValidCommand(Guid.NewGuid()) with { Title = string.Empty });

        result.ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public async Task Handle_WhenNeighborhoodMissing_ShouldFail()
    {
        var neighborhoodId = Guid.NewGuid();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var neighborhoodRepository = Substitute.For<IRepository<Neighborhood>>();
        unitOfWork.Repository<Neighborhood>().Returns(neighborhoodRepository);
        neighborhoodRepository.GetByIdAsync(neighborhoodId, Arg.Any<CancellationToken>()).Returns((Neighborhood?)null);
        var handler = new RegisterCitizenPropertyCommandHandler(unitOfWork);

        var result = await handler.Handle(ValidCommand(neighborhoodId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenStreetBelongsToOtherNeighborhood_ShouldFail()
    {
        var district = District.Create("Arnavutköy");
        var neighborhood = Neighborhood.Create(district.Id, "Hadımköy", "Muhtar", "0555", 1000);
        var otherNeighborhood = Neighborhood.Create(district.Id, "Taşoluk", "Muhtar2", "0556", 2000);
        var street = Street.Create(otherNeighborhood.Id, "Yanlış Sokak");

        var unitOfWork = Substitute.For<IUnitOfWork>();
        var neighborhoodRepository = Substitute.For<IRepository<Neighborhood>>();
        var streetRepository = Substitute.For<IRepository<Street>>();
        unitOfWork.Repository<Neighborhood>().Returns(neighborhoodRepository);
        unitOfWork.Repository<Street>().Returns(streetRepository);
        neighborhoodRepository.GetByIdAsync(neighborhood.Id, Arg.Any<CancellationToken>()).Returns(neighborhood);
        streetRepository.GetByIdAsync(street.Id, Arg.Any<CancellationToken>()).Returns(street);
        var handler = new RegisterCitizenPropertyCommandHandler(unitOfWork);

        var result = await handler.Handle(ValidCommand(neighborhood.Id, street.Id), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(e => e.Contains("mahalleye ait değil", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Handle_WhenValid_ShouldPersist()
    {
        var district = District.Create("Arnavutköy");
        var neighborhood = Neighborhood.Create(district.Id, "Hadımköy", "Muhtar", "0555", 1000);
        var street = Street.Create(neighborhood.Id, "Atatürk Caddesi");

        var unitOfWork = Substitute.For<IUnitOfWork>();
        var neighborhoodRepository = Substitute.For<IRepository<Neighborhood>>();
        var streetRepository = Substitute.For<IRepository<Street>>();
        var propertyRepository = Substitute.For<IRepository<CitizenProperty>>();
        unitOfWork.Repository<Neighborhood>().Returns(neighborhoodRepository);
        unitOfWork.Repository<Street>().Returns(streetRepository);
        unitOfWork.Repository<CitizenProperty>().Returns(propertyRepository);
        neighborhoodRepository.GetByIdAsync(neighborhood.Id, Arg.Any<CancellationToken>()).Returns(neighborhood);
        streetRepository.GetByIdAsync(street.Id, Arg.Any<CancellationToken>()).Returns(street);
        var handler = new RegisterCitizenPropertyCommandHandler(unitOfWork);

        var result = await handler.Handle(ValidCommand(neighborhood.Id, street.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await propertyRepository.Received(1).AddAsync(Arg.Any<CitizenProperty>(), Arg.Any<CancellationToken>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
