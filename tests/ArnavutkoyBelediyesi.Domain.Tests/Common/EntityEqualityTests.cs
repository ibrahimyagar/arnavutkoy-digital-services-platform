using ArnavutkoyBelediyesi.Domain.Geography;

namespace ArnavutkoyBelediyesi.Domain.Tests.Common;

/// <summary>
/// <see cref="ArnavutkoyBelediyesi.Domain.Common.Entity"/> temel sınıfının kimlik tabanlı eşitlik
/// davranışını, somut bir entity (<see cref="District"/>) üzerinden doğrular.
/// </summary>
public sealed class EntityEqualityTests
{
    [Fact]
    public void Equals_WithSameReference_ShouldReturnTrue()
    {
        var district = District.Create("Arnavutköy");

        district.Equals(district).Should().BeTrue();
    }

    [Fact]
    public void Equals_WithDifferentEntitiesOfSameType_ShouldReturnFalse()
    {
        var first = District.Create("Arnavutköy");
        var second = District.Create("Arnavutköy");

        first.Equals(second).Should().BeFalse();
    }

    [Fact]
    public void Equals_WithNull_ShouldReturnFalse()
    {
        var district = District.Create("Arnavutköy");

        district.Equals(null).Should().BeFalse();
    }

    [Fact]
    public void GetHashCode_ForSameEntity_ShouldBeConsistent()
    {
        var district = District.Create("Arnavutköy");

        district.GetHashCode().Should().Be(district.GetHashCode());
    }
}
