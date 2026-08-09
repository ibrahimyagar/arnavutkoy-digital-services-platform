using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.Payments;
using ArnavutkoyBelediyesi.Domain.Payments.Events;

namespace ArnavutkoyBelediyesi.Domain.Tests.Payments;

public sealed class DebtTests
{
    private static readonly Guid DebtorUserId = Guid.NewGuid();
    private static readonly DateTime DueDate = new(2026, 1, 15, 0, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Create_WithPositivePrincipalAmount_ShouldCreateUnpaidDebt()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);

        debt.DebtorUserId.Should().Be(DebtorUserId);
        debt.Type.Should().Be(DebtType.Water);
        debt.PrincipalAmount.Should().Be(100m);
        debt.Status.Should().Be(DebtStatus.Unpaid);
        debt.PaidAtUtc.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    public void Create_WithNonPositivePrincipalAmount_ShouldThrow(decimal amount)
    {
        var act = () => Debt.Create(DebtorUserId, DebtType.Water, amount, DueDate);

        act.Should().Throw<ArgumentOutOfRangeException>();
    }

    [Fact]
    public void CalculateOverdueInterest_BeforeDueDate_ShouldReturnZero()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);

        var interest = debt.CalculateOverdueInterest(DueDate.AddDays(-5), dailyInterestRatePercent: 1m);

        interest.Should().Be(0m);
    }

    [Fact]
    public void CalculateOverdueInterest_OnDueDate_ShouldReturnZero()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);

        var interest = debt.CalculateOverdueInterest(DueDate, dailyInterestRatePercent: 1m);

        interest.Should().Be(0m);
    }

    [Fact]
    public void CalculateOverdueInterest_AfterDueDate_ShouldReturnExpectedAmount()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);

        // 10 gün gecikme, günlük %1 -> 100 * 0.01 * 10 = 10
        var interest = debt.CalculateOverdueInterest(DueDate.AddDays(10), dailyInterestRatePercent: 1m);

        interest.Should().Be(10m);
    }

    [Fact]
    public void CalculateOverdueInterest_WhenAlreadyPaid_ShouldReturnZero()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);
        debt.MarkAsPaid(Guid.NewGuid(), DueDate.AddDays(10));

        var interest = debt.CalculateOverdueInterest(DueDate.AddDays(20), dailyInterestRatePercent: 1m);

        interest.Should().Be(0m);
    }

    [Fact]
    public void CalculateTotalPayable_ShouldIncludePrincipalAndInterest()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);

        var total = debt.CalculateTotalPayable(DueDate.AddDays(10), dailyInterestRatePercent: 1m);

        total.Should().Be(110m);
    }

    [Fact]
    public void MarkAsPaid_WhenUnpaid_ShouldUpdateStatusAndRaiseDomainEvent()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);
        var paymentId = Guid.NewGuid();
        var paidAt = DueDate.AddDays(2);

        debt.MarkAsPaid(paymentId, paidAt);

        debt.Status.Should().Be(DebtStatus.Paid);
        debt.PaidAtUtc.Should().Be(paidAt);
        debt.PaymentId.Should().Be(paymentId);
        debt.DomainEvents.Should().ContainSingle()
            .Which.Should().BeOfType<DebtPaidDomainEvent>();
    }

    [Fact]
    public void MarkAsPaid_WhenAlreadyPaid_ShouldThrowDebtAlreadyPaidException()
    {
        var debt = Debt.Create(DebtorUserId, DebtType.Water, 100m, DueDate);
        debt.MarkAsPaid(Guid.NewGuid(), DueDate);

        var act = () => debt.MarkAsPaid(Guid.NewGuid(), DueDate.AddDays(1));

        act.Should().Throw<DebtAlreadyPaidException>();
    }
}
