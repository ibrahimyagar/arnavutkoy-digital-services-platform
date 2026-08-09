using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Geography.Commands;
using ArnavutkoyBelediyesi.Domain.Geography;
using FluentValidation.TestHelper;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Geography.Commands;

public sealed class CreateDistrictCommandTests
{
    private readonly CreateDistrictCommandValidator _validator = new();

    [Fact]
    public void Validate_WithBlankName_ShouldHaveError()
    {
        var result = _validator.TestValidate(new CreateDistrictCommand(string.Empty));

        result.ShouldHaveValidationErrorFor(x => x.Name);
    }

    [Fact]
    public async Task Handle_ShouldPersistDistrictAndReturnItsId()
    {
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repository = Substitute.For<IRepository<District>>();
        unitOfWork.Repository<District>().Returns(repository);
        var handler = new CreateDistrictCommandHandler(unitOfWork);

        var result = await handler.Handle(new CreateDistrictCommand("Arnavutköy"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await repository.Received(1).AddAsync(Arg.Any<District>(), Arg.Any<CancellationToken>());
        await unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}

public sealed class CreateNeighborhoodCommandTests
{
    private readonly CreateNeighborhoodCommandValidator _validator = new();

    private static CreateNeighborhoodCommand ValidCommand(Guid districtId) =>
        new(districtId, "Hadımköy", "Ali Veli", "05551112233", 1000);

    [Fact]
    public void Validate_WithNegativePopulation_ShouldHaveError()
    {
        var command = ValidCommand(Guid.NewGuid()) with { Population = -1 };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Population);
    }

    [Fact]
    public async Task Handle_WhenDistrictNotFound_ShouldReturnFailure()
    {
        var districtId = Guid.NewGuid();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var districtRepository = Substitute.For<IRepository<District>>();
        unitOfWork.Repository<District>().Returns(districtRepository);
        districtRepository.GetByIdAsync(districtId, Arg.Any<CancellationToken>()).Returns((District?)null);
        var handler = new CreateNeighborhoodCommandHandler(unitOfWork);

        var result = await handler.Handle(ValidCommand(districtId), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenDistrictFound_ShouldCreateNeighborhood()
    {
        var district = District.Create("Arnavutköy");
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var districtRepository = Substitute.For<IRepository<District>>();
        var neighborhoodRepository = Substitute.For<IRepository<Neighborhood>>();
        unitOfWork.Repository<District>().Returns(districtRepository);
        unitOfWork.Repository<Neighborhood>().Returns(neighborhoodRepository);
        districtRepository.GetByIdAsync(district.Id, Arg.Any<CancellationToken>()).Returns(district);
        var handler = new CreateNeighborhoodCommandHandler(unitOfWork);

        var result = await handler.Handle(ValidCommand(district.Id), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await neighborhoodRepository.Received(1).AddAsync(Arg.Any<Neighborhood>(), Arg.Any<CancellationToken>());
    }
}
