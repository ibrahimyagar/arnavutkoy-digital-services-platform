using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Tests.Common;

public sealed class TurkishNationalIdValidatorTests
{
    [Theory]
    [InlineData("10000000146")]
    [InlineData("12345678950")]
    [InlineData("11111111110")]
    public void IsValid_WithCorrectChecksum_ShouldReturnTrue(string nationalId)
    {
        var result = TurkishNationalIdValidator.IsValid(nationalId);

        result.Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("1234567890")]
    [InlineData("123456789012")]
    [InlineData("01234567890")]
    [InlineData("1234567890a")]
    [InlineData("10000000147")]
    [InlineData("56789012340")]
    public void IsValid_WithInvalidFormatOrChecksum_ShouldReturnFalse(string? nationalId)
    {
        var result = TurkishNationalIdValidator.IsValid(nationalId);

        result.Should().BeFalse();
    }
}
