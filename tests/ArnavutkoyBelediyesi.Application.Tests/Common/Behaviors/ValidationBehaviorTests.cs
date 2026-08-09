using ArnavutkoyBelediyesi.Application.Common.Behaviors;
using ArnavutkoyBelediyesi.Application.Common.Models;
using FluentValidation;
using FluentValidation.Results;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Tests.Common.Behaviors;

public sealed class ValidationBehaviorTests
{
    public sealed record SampleRequest(string Name) : IRequest<Result>;

    public sealed record SampleRequestWithValue(string Name) : IRequest<Result<Guid>>;

    [Fact]
    public async Task Handle_WithNoValidators_ShouldCallNext()
    {
        var behavior = new ValidationBehavior<SampleRequest, Result>([]);
        var nextCalled = false;

        var result = await behavior.Handle(
            new SampleRequest("test"),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        nextCalled.Should().BeTrue();
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithPassingValidators_ShouldCallNext()
    {
        var validator = Substitute.For<IValidator<SampleRequest>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<SampleRequest>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult());

        var behavior = new ValidationBehavior<SampleRequest, Result>([validator]);
        var nextCalled = false;

        var result = await behavior.Handle(
            new SampleRequest("test"),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        nextCalled.Should().BeTrue();
        result.IsSuccess.Should().BeTrue();
    }

    [Fact]
    public async Task Handle_WithFailingValidator_ShouldShortCircuitAndReturnFailureResult()
    {
        var validator = Substitute.For<IValidator<SampleRequest>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<SampleRequest>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Ad boş olamaz.")]));

        var behavior = new ValidationBehavior<SampleRequest, Result>([validator]);
        var nextCalled = false;

        var result = await behavior.Handle(
            new SampleRequest(string.Empty),
            () =>
            {
                nextCalled = true;
                return Task.FromResult(Result.Success());
            },
            CancellationToken.None);

        nextCalled.Should().BeFalse();
        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain("Ad boş olamaz.");
    }

    [Fact]
    public async Task Handle_WithFailingValidator_ForGenericResult_ShouldReturnFailureResultOfT()
    {
        var validator = Substitute.For<IValidator<SampleRequestWithValue>>();
        validator.ValidateAsync(Arg.Any<ValidationContext<SampleRequestWithValue>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Ad boş olamaz.")]));

        var behavior = new ValidationBehavior<SampleRequestWithValue, Result<Guid>>([validator]);

        var result = await behavior.Handle(
            new SampleRequestWithValue(string.Empty),
            () => Task.FromResult(Result<Guid>.Success(Guid.NewGuid())),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Should().Contain("Ad boş olamaz.");
    }

    [Fact]
    public async Task Handle_WithMultipleValidatorsReportingSameError_ShouldDeduplicateErrors()
    {
        var validator1 = Substitute.For<IValidator<SampleRequest>>();
        validator1.ValidateAsync(Arg.Any<ValidationContext<SampleRequest>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Ad boş olamaz.")]));

        var validator2 = Substitute.For<IValidator<SampleRequest>>();
        validator2.ValidateAsync(Arg.Any<ValidationContext<SampleRequest>>(), Arg.Any<CancellationToken>())
            .Returns(new ValidationResult([new ValidationFailure("Name", "Ad boş olamaz.")]));

        var behavior = new ValidationBehavior<SampleRequest, Result>([validator1, validator2]);

        var result = await behavior.Handle(
            new SampleRequest(string.Empty),
            () => Task.FromResult(Result.Success()),
            CancellationToken.None);

        result.Errors.Should().HaveCount(1);
    }
}
