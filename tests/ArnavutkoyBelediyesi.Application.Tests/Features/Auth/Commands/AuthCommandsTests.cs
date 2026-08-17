using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Features.Auth.Commands;
using ArnavutkoyBelediyesi.Application.Features.Auth.Services;
using FluentValidation.TestHelper;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Auth.Commands;

public sealed class RegisterCitizenCommandValidatorTests
{
    private readonly RegisterCitizenCommandValidator _validator = new();

    private static RegisterCitizenCommand ValidCommand() =>
        new(
            "ahmet@test.local",
            "Ahmet Yılmaz",
            "05551112233",
            "12345678950",
            new DateOnly(1995, 6, 15),
            "E",
            "Sifre123");

    [Fact]
    public void Validate_WithValidCommand_ShouldNotHaveErrors()
    {
        var result = _validator.TestValidate(ValidCommand());

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Validate_WithPaddedEmail_ShouldNotHaveError()
    {
        var command = ValidCommand() with { Email = "  ahmet@test.local  " };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("")]
    public void Validate_WithInvalidEmail_ShouldHaveError(string email)
    {
        var command = ValidCommand() with { Email = email };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }

    [Fact]
    public void Validate_WithEmptyNationalId_ShouldNotHaveError()
    {
        var command = ValidCommand() with { NationalId = "" };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.NationalId);
    }

    [Fact]
    public void Validate_WithNullNationalId_ShouldNotHaveError()
    {
        var command = ValidCommand() with { NationalId = null };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.NationalId);
    }

    [Theory]
    [InlineData("12345678901")]
    [InlineData("123")]
    [InlineData("abcdefghijk")]
    public void Validate_WithInvalidNationalId_ShouldHaveError(string nationalId)
    {
        var command = ValidCommand() with { NationalId = nationalId };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.NationalId);
    }

    [Theory]
    [InlineData("1234567")]
    [InlineData("onlyletters")]
    [InlineData("12345678")]
    public void Validate_WithWeakPassword_ShouldHaveError(string password)
    {
        var command = ValidCommand() with { Password = password };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Password);
    }

    [Fact]
    public void Validate_WithInvalidPhoneNumber_ShouldHaveError()
    {
        var command = ValidCommand() with { PhoneNumber = "abc" };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.PhoneNumber);
    }

    [Fact]
    public void Validate_WithEmptyGender_ShouldNotHaveError()
    {
        var command = ValidCommand() with { Gender = "" };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.Gender);
    }

    [Fact]
    public void Validate_WithNullBirthDate_ShouldNotHaveError()
    {
        var command = ValidCommand() with { BirthDate = null };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.BirthDate);
    }

    [Fact]
    public void Validate_WithUnder18BirthDate_ShouldHaveError()
    {
        var under18 = DateOnly.FromDateTime(DateTime.UtcNow.AddYears(-17));
        var command = ValidCommand() with { BirthDate = under18 };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.BirthDate);
    }

    [Fact]
    public void Validate_WithPhoneContainingSpaces_ShouldNotHaveError()
    {
        var command = ValidCommand() with { PhoneNumber = "0555 111 22 33" };

        var result = _validator.TestValidate(command);

        result.ShouldNotHaveValidationErrorFor(x => x.PhoneNumber);
    }
}

public sealed class RegisterCitizenCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldDelegateToIdentityService()
    {
        var identityService = Substitute.For<IIdentityService>();
        var expected = Result<Guid>.Success(Guid.NewGuid());
        identityService
            .CreateCitizenAsync(
                "ahmet@test.local",
                "Ahmet Yılmaz",
                "05551112233",
                "12345678950",
                new DateOnly(1995, 6, 15),
                "E",
                "Sifre123",
                Arg.Any<CancellationToken>())
            .Returns(expected);
        var handler = new RegisterCitizenCommandHandler(identityService);

        var result = await handler.Handle(
            new RegisterCitizenCommand(
                "ahmet@test.local",
                "Ahmet Yılmaz",
                "05551112233",
                "12345678950",
                new DateOnly(1995, 6, 15),
                "E",
                "Sifre123"),
            CancellationToken.None);

        result.Should().Be(expected);
    }
}

public sealed class LoginCommandValidatorTests
{
    private readonly LoginCommandValidator _validator = new();

    [Theory]
    [InlineData("ahmet@test.local")]
    [InlineData("AHMET@test.local")]
    [InlineData("  ahmet@test.local  ")]
    public void Validate_WithUsableEmail_ShouldNotHaveError(string email)
    {
        var result = _validator.TestValidate(new LoginCommand(email, "Sifre123"));

        result.ShouldNotHaveValidationErrorFor(x => x.Email);
    }

    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public void Validate_WithInvalidEmail_ShouldHaveError(string email)
    {
        var result = _validator.TestValidate(new LoginCommand(email, "Sifre123"));

        result.ShouldHaveValidationErrorFor(x => x.Email);
    }
}

/// <summary>
/// <see cref="AuthTokenIssuer"/> sealed olduğundan mock'lanamaz; testlerde gerçek örneği,
/// yalnızca alt bağımlılıkları (arayüzler) sahtelenmiş olarak kullanmak en doğru yaklaşımdır.
/// </summary>
public sealed class LoginCommandHandlerTests
{
    private readonly IIdentityService _identityService = Substitute.For<IIdentityService>();
    private readonly IJwtTokenGenerator _jwtTokenGenerator = Substitute.For<IJwtTokenGenerator>();
    private readonly IRefreshTokenRepository _refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();

    private LoginCommandHandler CreateHandler()
    {
        _dateTimeProvider.UtcNow.Returns(new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc));
        var jwtOptions = Options.Create(new JwtOptions
        {
            AccessTokenLifetimeMinutes = 15,
            RefreshTokenLifetimeDays = 7,
        });
        var tokenIssuer = new AuthTokenIssuer(_jwtTokenGenerator, _refreshTokenRepository, _dateTimeProvider, jwtOptions);
        return new LoginCommandHandler(_identityService, tokenIssuer);
    }

    [Fact]
    public async Task Handle_WhenCredentialsInvalid_ShouldReturnFailureWithoutIssuingToken()
    {
        _identityService
            .ValidateCredentialsAsync("ahmet@test.local", "wrong", Arg.Any<CancellationToken>())
            .Returns(Result<AuthenticatedUser>.Failure("E-posta veya parola hatalı."));
        var handler = CreateHandler();

        var result = await handler.Handle(new LoginCommand("ahmet@test.local", "wrong"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        _jwtTokenGenerator.DidNotReceive().GenerateAccessToken(Arg.Any<Guid>(), Arg.Any<string>(), Arg.Any<IEnumerable<string>>());
    }

    [Fact]
    public async Task Handle_WhenCredentialsValid_ShouldIssueAccessAndRefreshTokens()
    {
        var user = new AuthenticatedUser(Guid.NewGuid(), "Ahmet Yılmaz", ["Citizen"]);
        _identityService
            .ValidateCredentialsAsync("ahmet@test.local", "Sifre123", Arg.Any<CancellationToken>())
            .Returns(Result<AuthenticatedUser>.Success(user));
        _jwtTokenGenerator.GenerateAccessToken(user.UserId, user.FullName, user.Roles).Returns("access-token");
        _jwtTokenGenerator.GenerateRefreshToken().Returns("refresh-token");
        var handler = CreateHandler();

        var result = await handler.Handle(new LoginCommand("ahmet@test.local", "Sifre123"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("access-token");
        result.Value.RefreshToken.Should().Be("refresh-token");
        await _refreshTokenRepository.Received(1).AddAsync(user.UserId, Arg.Any<string>(), Arg.Any<DateTime>(), Arg.Any<CancellationToken>());
    }
}

public sealed class RefreshTokenCommandHandlerTests
{
    private readonly IRefreshTokenRepository _refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
    private readonly IIdentityService _identityService = Substitute.For<IIdentityService>();
    private readonly IJwtTokenGenerator _jwtTokenGenerator = Substitute.For<IJwtTokenGenerator>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private static readonly DateTime Now = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private RefreshTokenCommandHandler CreateHandler()
    {
        _dateTimeProvider.UtcNow.Returns(Now);
        var jwtOptions = Options.Create(new JwtOptions { AccessTokenLifetimeMinutes = 15, RefreshTokenLifetimeDays = 7 });
        var tokenIssuer = new AuthTokenIssuer(_jwtTokenGenerator, _refreshTokenRepository, _dateTimeProvider, jwtOptions);
        return new RefreshTokenCommandHandler(_refreshTokenRepository, _identityService, _dateTimeProvider, tokenIssuer);
    }

    [Fact]
    public async Task Handle_WhenTokenNotFound_ShouldReturnFailure()
    {
        _refreshTokenRepository.FindActiveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns((RefreshTokenLookup?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(new RefreshTokenCommand("some-token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenTokenRevoked_ShouldReturnFailure()
    {
        var lookup = new RefreshTokenLookup(Guid.NewGuid(), Guid.NewGuid(), Now.AddDays(1), IsRevoked: true);
        _refreshTokenRepository.FindActiveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(lookup);
        var handler = CreateHandler();

        var result = await handler.Handle(new RefreshTokenCommand("some-token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenTokenExpired_ShouldReturnFailure()
    {
        var lookup = new RefreshTokenLookup(Guid.NewGuid(), Guid.NewGuid(), Now.AddDays(-1), IsRevoked: false);
        _refreshTokenRepository.FindActiveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(lookup);
        var handler = CreateHandler();

        var result = await handler.Handle(new RefreshTokenCommand("some-token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenTokenValid_ShouldRevokeOldTokenAndIssueNewPair()
    {
        var userId = Guid.NewGuid();
        var lookup = new RefreshTokenLookup(Guid.NewGuid(), userId, Now.AddDays(1), IsRevoked: false);
        _refreshTokenRepository.FindActiveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(lookup);
        var user = new AuthenticatedUser(userId, "Ahmet Yılmaz", ["Citizen"]);
        _identityService.GetUserAsync(userId, Arg.Any<CancellationToken>()).Returns(Result<AuthenticatedUser>.Success(user));
        _jwtTokenGenerator.GenerateAccessToken(userId, user.FullName, user.Roles).Returns("new-access-token");
        _jwtTokenGenerator.GenerateRefreshToken().Returns("new-refresh-token");
        var handler = CreateHandler();

        var result = await handler.Handle(new RefreshTokenCommand("old-token"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        result.Value.AccessToken.Should().Be("new-access-token");
        result.Value.RefreshToken.Should().Be("new-refresh-token");
        await _refreshTokenRepository.Received(1).RevokeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenUserNoLongerExists_ShouldReturnFailureAfterRevokingOldToken()
    {
        var userId = Guid.NewGuid();
        var lookup = new RefreshTokenLookup(Guid.NewGuid(), userId, Now.AddDays(1), IsRevoked: false);
        _refreshTokenRepository.FindActiveAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(lookup);
        _identityService.GetUserAsync(userId, Arg.Any<CancellationToken>()).Returns(Result<AuthenticatedUser>.Failure("Kullanıcı bulunamadı."));
        var handler = CreateHandler();

        var result = await handler.Handle(new RefreshTokenCommand("old-token"), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        await _refreshTokenRepository.Received(1).RevokeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }
}

public sealed class ChangePasswordCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldDelegateToIdentityService()
    {
        var identityService = Substitute.For<IIdentityService>();
        var userId = Guid.NewGuid();
        identityService
            .ChangePasswordAsync(userId, "OldPass1", "NewPass1", Arg.Any<CancellationToken>())
            .Returns(Result.Success());
        var handler = new ChangePasswordCommandHandler(identityService);

        var result = await handler.Handle(new ChangePasswordCommand(userId, "OldPass1", "NewPass1"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}

public sealed class LogoutCommandHandlerTests
{
    [Fact]
    public async Task Handle_ShouldRevokeRefreshTokenAndAlwaysSucceed()
    {
        var refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
        var handler = new LogoutCommandHandler(refreshTokenRepository);

        var result = await handler.Handle(new LogoutCommand("some-token"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await refreshTokenRepository.Received(1).RevokeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WhenTokenDoesNotExist_ShouldStillSucceed_ToAvoidTokenEnumeration()
    {
        var refreshTokenRepository = Substitute.For<IRefreshTokenRepository>();
        refreshTokenRepository.RevokeAsync(Arg.Any<string>(), Arg.Any<CancellationToken>()).Returns(Task.CompletedTask);
        var handler = new LogoutCommandHandler(refreshTokenRepository);

        var result = await handler.Handle(new LogoutCommand("non-existent-token"), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
    }
}
