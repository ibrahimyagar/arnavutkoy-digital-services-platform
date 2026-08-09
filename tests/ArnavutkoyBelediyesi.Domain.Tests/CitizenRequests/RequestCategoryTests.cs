using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Domain.Tests.CitizenRequests;

public sealed class RequestCategoryTests
{
    [Fact]
    public void Create_WithValidName_ShouldBeActiveByDefault()
    {
        var category = RequestCategory.Create("Altyapı Arızası");

        category.Name.Should().Be("Altyapı Arızası");
        category.IsActive.Should().BeTrue();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_ShouldThrow(string name)
    {
        var act = () => RequestCategory.Create(name);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Deactivate_ShouldSetIsActiveToFalse()
    {
        var category = RequestCategory.Create("Temizlik");

        category.Deactivate();

        category.IsActive.Should().BeFalse();
    }

    [Fact]
    public void Activate_ShouldSetIsActiveToTrue()
    {
        var category = RequestCategory.Create("Temizlik");
        category.Deactivate();

        category.Activate();

        category.IsActive.Should().BeTrue();
    }
}
