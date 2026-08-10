using ArnavutkoyBelediyesi.Domain.Properties;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.Properties;

public sealed class CitizenPropertyTests
{
    [Fact]
    public void Create_WithValidData_Succeeds()
    {
        var ownerId = Guid.NewGuid();
        var neighborhoodId = Guid.NewGuid();
        var streetId = Guid.NewGuid();

        var property = CitizenProperty.Create(
            ownerId,
            neighborhoodId,
            streetId,
            PropertyType.Residential,
            "  Hadımköy Konut  ",
            " 12A ",
            " 123/45 ");

        property.OwnerUserId.Should().Be(ownerId);
        property.NeighborhoodId.Should().Be(neighborhoodId);
        property.StreetId.Should().Be(streetId);
        property.Title.Should().Be("Hadımköy Konut");
        property.DoorNumber.Should().Be("12A");
        property.BlockParcel.Should().Be("123/45");
        property.IsActive.Should().BeTrue();
    }

    [Fact]
    public void Create_WithEmptyOwner_Throws()
    {
        var act = () => CitizenProperty.Create(
            Guid.Empty,
            Guid.NewGuid(),
            null,
            PropertyType.Land,
            "Arsa",
            "1",
            string.Empty);

        act.Should().Throw<ArgumentException>().WithParameterName("ownerUserId");
    }

    [Fact]
    public void Deactivate_SetsInactive()
    {
        var property = CitizenProperty.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            PropertyType.Commercial,
            "Dükkan",
            "5",
            "10/2");

        property.Deactivate();

        property.IsActive.Should().BeFalse();
    }

    [Fact]
    public void UpdateAddress_ChangesFields()
    {
        var property = CitizenProperty.Create(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            PropertyType.Residential,
            "Ev",
            "1",
            "1/1");

        var newNeighborhood = Guid.NewGuid();
        var newStreet = Guid.NewGuid();

        property.UpdateAddress(newNeighborhood, newStreet, "9B", "99/9");

        property.NeighborhoodId.Should().Be(newNeighborhood);
        property.StreetId.Should().Be(newStreet);
        property.DoorNumber.Should().Be("9B");
        property.BlockParcel.Should().Be("99/9");
    }
}
