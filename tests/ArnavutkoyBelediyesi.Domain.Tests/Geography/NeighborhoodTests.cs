using ArnavutkoyBelediyesi.Domain.Geography;

namespace ArnavutkoyBelediyesi.Domain.Tests.Geography;

public sealed class NeighborhoodTests
{
    private static readonly Guid DistrictId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidData_ShouldSetTrimmedFields()
    {
        var neighborhood = Neighborhood.Create(DistrictId, "  Hadımköy  ", "  Ali Veli  ", "  05551112233  ", 15000);

        neighborhood.DistrictId.Should().Be(DistrictId);
        neighborhood.Name.Should().Be("Hadımköy");
        neighborhood.HeadmanFullName.Should().Be("Ali Veli");
        neighborhood.HeadmanPhoneNumber.Should().Be("05551112233");
        neighborhood.Population.Should().Be(15000);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_ShouldThrow(string name)
    {
        var act = () => Neighborhood.Create(DistrictId, name, "Ali Veli", "05551112233", 1000);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_WithNegativePopulation_ShouldThrow()
    {
        var act = () => Neighborhood.Create(DistrictId, "Hadımköy", "Ali Veli", "05551112233", -1);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void UpdateHeadman_WithValidData_ShouldUpdateFields()
    {
        var neighborhood = Neighborhood.Create(DistrictId, "Hadımköy", "Ali Veli", "05551112233", 1000);

        neighborhood.UpdateHeadman("Veli Ali", "05559998877");

        neighborhood.HeadmanFullName.Should().Be("Veli Ali");
        neighborhood.HeadmanPhoneNumber.Should().Be("05559998877");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void UpdateHeadman_WithBlankName_ShouldThrow(string headmanFullName)
    {
        var neighborhood = Neighborhood.Create(DistrictId, "Hadımköy", "Ali Veli", "05551112233", 1000);

        var act = () => neighborhood.UpdateHeadman(headmanFullName, "05559998877");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void UpdatePopulation_WithNonNegativeValue_ShouldUpdate()
    {
        var neighborhood = Neighborhood.Create(DistrictId, "Hadımköy", "Ali Veli", "05551112233", 1000);

        neighborhood.UpdatePopulation(2000);

        neighborhood.Population.Should().Be(2000);
    }

    [Fact]
    public void UpdatePopulation_WithNegativeValue_ShouldThrow()
    {
        var neighborhood = Neighborhood.Create(DistrictId, "Hadımköy", "Ali Veli", "05551112233", 1000);

        var act = () => neighborhood.UpdatePopulation(-5);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }
}
