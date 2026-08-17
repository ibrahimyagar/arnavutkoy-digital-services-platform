using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Domain.Tests.Common;

public sealed class EmailNormalizerTests
{
    [Theory]
    [InlineData("test@example.com", "test@example.com")]
    [InlineData("TEST@example.com", "test@example.com")]
    [InlineData(" test@example.com ", "test@example.com")]
    [InlineData("\u00A0test@example.com\u00A0", "test@example.com")]
    [InlineData("\u0130nfo@example.com", "info@example.com")]
    [InlineData("INFO@EXAMPLE.COM", "info@example.com")]
    public void Normalize_ShouldFoldCaseTrimAndTurkishI(string input, string expected)
    {
        EmailNormalizer.Normalize(input).Should().Be(expected);
    }

    [Fact]
    public void ToLookupKey_ShouldMatchIdentityUppercaseStore()
    {
        EmailNormalizer.ToLookupKey(" Test@Example.COM ").Should().Be("TEST@EXAMPLE.COM");
        EmailNormalizer.ToLookupKey("\u0130nfo@example.com").Should().Be("INFO@EXAMPLE.COM");
    }

    [Theory]
    [InlineData("test@example.com")]
    [InlineData(" TEST@example.com ")]
    public void IsValid_WithWellFormedEmail_ShouldReturnTrue(string email)
    {
        EmailNormalizer.IsValid(email).Should().BeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("not-an-email")]
    [InlineData("missing-domain@")]
    public void IsValid_WithMalformedEmail_ShouldReturnFalse(string? email)
    {
        EmailNormalizer.IsValid(email).Should().BeFalse();
    }
}
