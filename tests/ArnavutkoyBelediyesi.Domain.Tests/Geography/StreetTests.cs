using ArnavutkoyBelediyesi.Domain.Geography;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.Geography;

public sealed class StreetTests
{
    [Fact]
    public void Create_WithValidData_Succeeds()
    {
        var neighborhoodId = Guid.NewGuid();

        var street = Street.Create(neighborhoodId, "  Atatürk Caddesi  ");

        street.NeighborhoodId.Should().Be(neighborhoodId);
        street.Name.Should().Be("Atatürk Caddesi");
    }

    [Fact]
    public void Create_WithEmptyNeighborhoodId_Throws()
    {
        var act = () => Street.Create(Guid.Empty, "Test Sokak");

        act.Should().Throw<ArgumentException>().WithParameterName("neighborhoodId");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_Throws(string? name)
    {
        var act = () => Street.Create(Guid.NewGuid(), name!);

        act.Should().Throw<ArgumentException>().WithParameterName("name");
    }

    [Fact]
    public void Rename_UpdatesName()
    {
        var street = Street.Create(Guid.NewGuid(), "Eski Sokak");

        street.Rename("  Yeni Cadde  ");

        street.Name.Should().Be("Yeni Cadde");
    }
}
