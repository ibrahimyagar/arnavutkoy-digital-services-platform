using ArnavutkoyBelediyesi.Domain.Geography;

namespace ArnavutkoyBelediyesi.Domain.Tests.Geography;

public sealed class DistrictTests
{
    [Fact]
    public void Create_WithValidName_ShouldTrimAndSetName()
    {
        var district = District.Create("  Arnavutköy  ");

        district.Name.Should().Be("Arnavutköy");
        district.Neighborhoods.Should().BeEmpty();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_ShouldThrow(string name)
    {
        var act = () => District.Create(name);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Rename_WithValidName_ShouldUpdateName()
    {
        var district = District.Create("Arnavutköy");

        district.Rename("Yeni İsim");

        district.Name.Should().Be("Yeni İsim");
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Rename_WithBlankName_ShouldThrow(string newName)
    {
        var district = District.Create("Arnavutköy");

        var act = () => district.Rename(newName);

        act.Should().Throw<ArgumentException>();
    }
}
