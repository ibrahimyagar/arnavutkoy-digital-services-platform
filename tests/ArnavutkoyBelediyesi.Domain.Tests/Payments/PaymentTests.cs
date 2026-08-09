using ArnavutkoyBelediyesi.Domain.Payments;

namespace ArnavutkoyBelediyesi.Domain.Tests.Payments;

public sealed class PaymentTests
{
    private static readonly Guid DebtId = Guid.NewGuid();
    private static readonly Guid PayerUserId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidData_ShouldMaskCardNumberAndKeepFirstAndLastFourDigits()
    {
        var payment = Payment.Create(DebtId, PayerUserId, 150m, "Ahmet Yılmaz", "5312 3456 7890 9821");

        payment.DebtId.Should().Be(DebtId);
        payment.PayerUserId.Should().Be(PayerUserId);
        payment.Amount.Should().Be(150m);
        payment.CardHolderName.Should().Be("Ahmet Yılmaz");
        payment.MaskedCardNumber.Should().Be("5312********9821");
    }

    [Fact]
    public void Create_ShouldNeverPersistFullCardNumberAnywhere()
    {
        const string fullCardNumber = "5312345678909821";

        var payment = Payment.Create(DebtId, PayerUserId, 150m, "Ahmet Yılmaz", fullCardNumber);

        payment.MaskedCardNumber.Should().NotContain("345678");
        payment.MaskedCardNumber.Should().NotBe(fullCardNumber);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-10)]
    public void Create_WithNonPositiveAmount_ShouldThrow(decimal amount)
    {
        var act = () => Payment.Create(DebtId, PayerUserId, amount, "Ahmet Yılmaz", "5312345678909821");

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankCardHolderName_ShouldThrow(string cardHolderName)
    {
        var act = () => Payment.Create(DebtId, PayerUserId, 100m, cardHolderName, "5312345678909821");

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Create_WithTooShortCardNumber_ShouldThrow()
    {
        var act = () => Payment.Create(DebtId, PayerUserId, 100m, "Ahmet Yılmaz", "1234");

        act.Should().Throw<ArgumentException>();
    }
}
