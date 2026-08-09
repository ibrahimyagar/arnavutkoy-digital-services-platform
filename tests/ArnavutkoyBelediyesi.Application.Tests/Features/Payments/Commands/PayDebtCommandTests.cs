using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Application.Features.Payments.Commands;
using ArnavutkoyBelediyesi.Domain.Payments;
using FluentValidation.TestHelper;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Payments.Commands;

public sealed class PayDebtCommandValidatorTests
{
    private readonly PayDebtCommandValidator _validator = new();

    private static PayDebtCommand ValidCommand() => new(
        Guid.NewGuid(),
        Guid.NewGuid(),
        "Ahmet Yılmaz",
        "5312345678909821",
        "12/28",
        "123");

    [Fact]
    public void Validate_WithValidCommand_ShouldNotHaveErrors()
    {
        var result = _validator.TestValidate(ValidCommand());

        result.ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData("123")]
    [InlineData("12345678901234567890")]
    public void Validate_WithInvalidCardNumberLength_ShouldHaveError(string cardNumber)
    {
        var command = ValidCommand() with { CardNumber = cardNumber };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.CardNumber);
    }

    [Theory]
    [InlineData("13/28")]
    [InlineData("00/28")]
    [InlineData("1228")]
    [InlineData("")]
    public void Validate_WithInvalidExpiry_ShouldHaveError(string expiry)
    {
        var command = ValidCommand() with { ExpiryMonthYear = expiry };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.ExpiryMonthYear);
    }

    [Theory]
    [InlineData("12")]
    [InlineData("12345")]
    [InlineData("abc")]
    public void Validate_WithInvalidCvv_ShouldHaveError(string cvv)
    {
        var command = ValidCommand() with { Cvv = cvv };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.Cvv);
    }

    [Fact]
    public void Validate_WithEmptyDebtId_ShouldHaveError()
    {
        var command = ValidCommand() with { DebtId = Guid.Empty };

        var result = _validator.TestValidate(command);

        result.ShouldHaveValidationErrorFor(x => x.DebtId);
    }
}

public sealed class PayDebtCommandHandlerTests
{
    private static readonly Guid DebtId = Guid.NewGuid();
    private static readonly Guid PayerUserId = Guid.NewGuid();
    private static readonly DateTime Now = new(2026, 3, 1, 12, 0, 0, DateTimeKind.Utc);

    private readonly IUnitOfWork _unitOfWork = Substitute.For<IUnitOfWork>();
    private readonly IRepository<Debt> _debtRepository = Substitute.For<IRepository<Debt>>();
    private readonly IRepository<Payment> _paymentRepository = Substitute.For<IRepository<Payment>>();
    private readonly IDateTimeProvider _dateTimeProvider = Substitute.For<IDateTimeProvider>();
    private readonly IOptions<PaymentOptions> _paymentOptions = Options.Create(new PaymentOptions { DailyOverdueInterestRatePercent = 1m });

    private PayDebtCommandHandler CreateHandler()
    {
        _unitOfWork.Repository<Debt>().Returns(_debtRepository);
        _unitOfWork.Repository<Payment>().Returns(_paymentRepository);
        _dateTimeProvider.UtcNow.Returns(Now);

        return new PayDebtCommandHandler(_unitOfWork, _dateTimeProvider, _paymentOptions);
    }

    private static PayDebtCommand Command() => new(DebtId, PayerUserId, "Ahmet Yılmaz", "5312345678909821", "12/28", "123");

    [Fact]
    public async Task Handle_WhenDebtNotFound_ShouldReturnFailure()
    {
        _debtRepository.GetByIdAsync(DebtId, Arg.Any<CancellationToken>()).Returns((Debt?)null);
        var handler = CreateHandler();

        var result = await handler.Handle(Command(), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Single().Should().Contain(DebtId.ToString());
    }

    [Fact]
    public async Task Handle_WhenDebtBelongsToAnotherUser_ShouldReturnFailure()
    {
        var debt = Debt.Create(Guid.NewGuid(), DebtType.Water, 100m, Now.AddDays(-10));
        _debtRepository.GetByIdAsync(DebtId, Arg.Any<CancellationToken>()).Returns(debt);
        var handler = CreateHandler();

        var result = await handler.Handle(Command(), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Single().Should().Contain("ödeme yapan kullanıcıya ait değildir");
    }

    [Fact]
    public async Task Handle_WhenDebtAlreadyPaid_ShouldReturnFailure()
    {
        var debt = Debt.Create(PayerUserId, DebtType.Water, 100m, Now.AddDays(-10));
        debt.MarkAsPaid(Guid.NewGuid(), Now.AddDays(-1));
        _debtRepository.GetByIdAsync(DebtId, Arg.Any<CancellationToken>()).Returns(debt);
        var handler = CreateHandler();

        var result = await handler.Handle(Command(), CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
        result.Errors.Single().Should().Contain("zaten ödenmiştir");
    }

    [Fact]
    public async Task Handle_WithValidPayment_ShouldMarkDebtAsPaidAndPersistPayment()
    {
        var debt = Debt.Create(PayerUserId, DebtType.Water, 100m, Now.AddDays(-10));
        _debtRepository.GetByIdAsync(DebtId, Arg.Any<CancellationToken>()).Returns(debt);
        var handler = CreateHandler();

        var result = await handler.Handle(Command(), CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        debt.Status.Should().Be(DebtStatus.Paid);
        await _paymentRepository.Received(1).AddAsync(Arg.Any<Payment>(), Arg.Any<CancellationToken>());
        _debtRepository.Received(1).Update(debt);
        await _unitOfWork.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_WithOverdueDebt_ShouldChargePrincipalPlusInterest()
    {
        var debt = Debt.Create(PayerUserId, DebtType.Water, 100m, Now.AddDays(-10));
        _debtRepository.GetByIdAsync(DebtId, Arg.Any<CancellationToken>()).Returns(debt);
        var handler = CreateHandler();

        Payment? capturedPayment = null;
        _ = _paymentRepository.AddAsync(Arg.Do<Payment>(p => capturedPayment = p), Arg.Any<CancellationToken>());

        await handler.Handle(Command(), CancellationToken.None);

        capturedPayment.Should().NotBeNull();
        capturedPayment!.Amount.Should().Be(110m);
    }
}
