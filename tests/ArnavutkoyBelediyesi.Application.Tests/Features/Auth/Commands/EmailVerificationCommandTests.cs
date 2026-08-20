using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Auth;
using ArnavutkoyBelediyesi.Application.Features.Auth.Commands;
using ArnavutkoyBelediyesi.Domain.Identity;
using FluentValidation.TestHelper;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Auth.Commands;

public sealed class VerifyEmailCommandValidatorTests
{
    private readonly VerifyEmailCommandValidator _validator = new();

    [Fact]
    public void Validate_WithValidCommand_ShouldNotHaveErrors()
    {
        var result = _validator.TestValidate(new VerifyEmailCommand("ahmet@test.local", "123456"));
        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("")]
    [InlineData("12")]
    [InlineData("abcdef")]
    [InlineData("12345")]
    [InlineData("1234567")]
    public void Validate_WithInvalidCode_ShouldHaveError(string code)
    {
        var result = _validator.TestValidate(new VerifyEmailCommand("ahmet@test.local", code));
        result.ShouldHaveValidationErrorFor(x => x.Code);
    }
}

public sealed class ResendVerificationCodeCommandHandlerTests
{
    private readonly IIdentityService _identityService = Substitute.For<IIdentityService>();
    private readonly IEmailVerificationIssuer _issuer = Substitute.For<IEmailVerificationIssuer>();

    private ResendVerificationCodeCommandHandler CreateHandler() =>
        new(_identityService, _issuer);

    [Fact]
    public async Task Handle_WhenEmailUnknown_ShouldSucceedWithoutIssuing()
    {
        _identityService.FindByEmailAsync("missing@test.local", Arg.Any<CancellationToken>())
            .Returns((EmailAccountLookup?)null);

        var result = await CreateHandler().Handle(
            new ResendVerificationCodeCommand("missing@test.local"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await _issuer.DidNotReceive().IssueAndSendAsync(
            Arg.Any<Guid>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenAlreadyConfirmed_ShouldSucceedWithoutIssuing()
    {
        var userId = Guid.NewGuid();
        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", true));

        var result = await CreateHandler().Handle(
            new ResendVerificationCodeCommand("ahmet@test.local"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await _issuer.DidNotReceive().IssueAndSendAsync(
            Arg.Any<Guid>(),
            Arg.Any<string>(),
            Arg.Any<string>(),
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenResendTooSoon_ShouldFail()
    {
        var userId = Guid.NewGuid();
        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _issuer.CanResendAsync(userId, Arg.Any<CancellationToken>()).Returns(false);

        var result = await CreateHandler().Handle(
            new ResendVerificationCodeCommand("ahmet@test.local"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(EmailVerificationMessages.ResendTooSoon);
    }

    [Fact]
    public async Task Handle_WhenCooldownElapsed_ShouldIssueNewCode()
    {
        var userId = Guid.NewGuid();
        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _issuer.CanResendAsync(userId, Arg.Any<CancellationToken>()).Returns(true);

        var result = await CreateHandler().Handle(
            new ResendVerificationCodeCommand("ahmet@test.local"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await _issuer.Received(1).IssueAndSendAsync(
            userId,
            "ahmet@test.local",
            "Ahmet",
            Arg.Any<CancellationToken>());
    }
}

public sealed class VerifyEmailCommandHandlerTests
{
    private readonly IIdentityService _identityService = Substitute.For<IIdentityService>();
    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<EmailVerificationCode> _repository = Substitute.For<IRepository<EmailVerificationCode>>();
    private readonly IDateTimeProvider _clock = Substitute.For<IDateTimeProvider>();

    public VerifyEmailCommandHandlerTests()
    {
        _unitOfWork.Repository<EmailVerificationCode>().Returns(_repository);
        _clock.UtcNow.Returns(new DateTime(2026, 8, 20, 12, 0, 0, DateTimeKind.Utc));
    }

    private VerifyEmailCommandHandler CreateHandler() =>
        new(_identityService, _unitOfWork, _clock);

    [Fact]
    public async Task Handle_WhenAccountMissing_ShouldFailWithGenericMessage()
    {
        _identityService.FindByEmailAsync("x@test.local", Arg.Any<CancellationToken>())
            .Returns((EmailAccountLookup?)null);

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("x@test.local", "123456"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(EmailVerificationMessages.InvalidOrExpiredCode);
    }

    [Fact]
    public async Task Handle_WhenAlreadyConfirmed_ShouldSucceed()
    {
        var userId = Guid.NewGuid();
        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", true));

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("ahmet@test.local", "123456"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithCorrectCode_ShouldConfirmAndConsume()
    {
        var userId = Guid.NewGuid();
        var now = _clock.UtcNow;
        const string plain = "654321";
        var entity = EmailVerificationCode.Create(userId, EmailVerificationCode.HashCode(userId, plain), now.AddMinutes(10));

        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _repository.Query().Returns(new[] { entity }.AsQueryable());
        _identityService.ConfirmEmailAsync(userId, Arg.Any<CancellationToken>())
            .Returns(Result.Success());

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("ahmet@test.local", plain),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        entity.IsConsumed.Should().BeTrue();
        await _identityService.Received(1).ConfirmEmailAsync(userId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithWrongCode_ShouldIncrementAttempts()
    {
        var userId = Guid.NewGuid();
        var now = _clock.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "111111"),
            now.AddMinutes(10));

        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _repository.Query().Returns(new[] { entity }.AsQueryable());

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("ahmet@test.local", "000000"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        entity.AttemptCount.Should().Be(1);
        await _identityService.DidNotReceive().ConfirmEmailAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithExpiredCode_ShouldFail()
    {
        var userId = Guid.NewGuid();
        var now = _clock.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "222222"),
            now.AddMinutes(-1));

        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _repository.Query().Returns(new[] { entity }.AsQueryable());

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("ahmet@test.local", "222222"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain(EmailVerificationMessages.InvalidOrExpiredCode);
    }

    [Fact]
    public async Task Handle_WhenMaxAttemptsExceeded_ShouldFail()
    {
        var userId = Guid.NewGuid();
        var now = _clock.UtcNow;
        var entity = EmailVerificationCode.Create(
            userId,
            EmailVerificationCode.HashCode(userId, "333333"),
            now.AddMinutes(10),
            maxAttempts: 1);
        entity.RecordFailedAttempt();

        _identityService.FindByEmailAsync("ahmet@test.local", Arg.Any<CancellationToken>())
            .Returns(new EmailAccountLookup(userId, "ahmet@test.local", "Ahmet", false));
        _repository.Query().Returns(new[] { entity }.AsQueryable());

        var result = await CreateHandler().Handle(
            new VerifyEmailCommand("ahmet@test.local", "333333"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        await _identityService.DidNotReceive().ConfirmEmailAsync(Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }
}
