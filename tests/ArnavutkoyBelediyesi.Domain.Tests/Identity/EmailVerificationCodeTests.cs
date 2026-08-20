using ArnavutkoyBelediyesi.Domain.Identity;

namespace ArnavutkoyBelediyesi.Domain.Tests.Identity;

public sealed class EmailVerificationCodeTests
{
    [Fact]
    public void GenerateNumericCode_ShouldBeSixDigits()
    {
        var code = EmailVerificationCode.GenerateNumericCode();

        code.Should().HaveLength(6);
        code.Should().MatchRegex(@"^\d{6}$");
    }

    [Fact]
    public void HashCode_ShouldBeDeterministicAndNotEqualPlainText()
    {
        var userId = Guid.NewGuid();
        var hash1 = EmailVerificationCode.HashCode(userId, "123456");
        var hash2 = EmailVerificationCode.HashCode(userId, "123456");

        hash1.Should().Be(hash2);
        hash1.Should().NotBe("123456");
        hash1.Should().HaveLength(64);
    }

    [Fact]
    public void CodesMatch_WithCorrectCode_ShouldReturnTrue()
    {
        var userId = Guid.NewGuid();
        var hash = EmailVerificationCode.HashCode(userId, "654321");

        EmailVerificationCode.CodesMatch(hash, userId, "654321").Should().BeTrue();
    }

    [Fact]
    public void CodesMatch_WithWrongCode_ShouldReturnFalse()
    {
        var userId = Guid.NewGuid();
        var hash = EmailVerificationCode.HashCode(userId, "654321");

        EmailVerificationCode.CodesMatch(hash, userId, "000000").Should().BeFalse();
    }

    [Fact]
    public void RecordFailedAttempt_ThenExceedMax_ShouldDeactivate()
    {
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "111111"),
            now.AddMinutes(10),
            maxAttempts: 2);

        entity.RecordFailedAttempt();
        entity.IsActive(now).Should().BeTrue();

        entity.RecordFailedAttempt();
        entity.IsActive(now).Should().BeFalse();
        entity.AttemptCount.Should().Be(2);
    }

    [Fact]
    public void MarkConsumed_ShouldDeactivate()
    {
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "222222"),
            now.AddMinutes(10));

        entity.MarkConsumed(now);

        entity.IsConsumed.Should().BeTrue();
        entity.IsActive(now).Should().BeFalse();
    }

    [Fact]
    public void IsActive_WhenExpired_ShouldReturnFalse()
    {
        var userId = Guid.NewGuid();
        var now = DateTime.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "333333"),
            now.AddMinutes(-1));

        entity.IsActive(now).Should().BeFalse();
    }
}
