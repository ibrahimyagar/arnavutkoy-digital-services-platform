using System.Text.RegularExpressions;
using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Common.Options;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.Payments;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Options;

namespace ArnavutkoyBelediyesi.Application.Features.Payments.Commands;

/// <summary>
/// Bir borcu, güncel gecikme faizi dahil toplam tutar üzerinden öder. <see cref="Cvv"/> alanı
/// yalnızca istek doğrulaması için kullanılır; hiçbir zaman kalıcı hale getirilmez veya loglanmaz
/// (bkz. <see cref="Domain.Payments.Payment"/> XML dokümantasyonu). Referans projedeki, oturum
/// açmamış kullanıcıların herhangi bir kart numarasına ödeme yapabilmesine izin veren güvenlik
/// açığının düzeltilmiş hâli olarak, ödeme yalnızca borcun sahibi tarafından yapılabilir.
/// </summary>
public sealed record PayDebtCommand(
    Guid DebtId,
    Guid PayerUserId,
    string CardHolderName,
    string CardNumber,
    string ExpiryMonthYear,
    string Cvv) : IRequest<Result<Guid>>;

public sealed class PayDebtCommandValidator : AbstractValidator<PayDebtCommand>
{
    private static readonly Regex ExpiryPattern = new(@"^(0[1-9]|1[0-2])\/\d{2}$", RegexOptions.Compiled);

    public PayDebtCommandValidator()
    {
        RuleFor(x => x.DebtId).NotEmpty();
        RuleFor(x => x.PayerUserId).NotEmpty();
        RuleFor(x => x.CardHolderName).NotEmpty().MaximumLength(150);

        RuleFor(x => x.CardNumber)
            .NotEmpty()
            .Must(number => number.Count(char.IsDigit) is >= 12 and <= 19)
            .WithMessage("Kart numarası 12-19 hane arasında olmalıdır.");

        RuleFor(x => x.ExpiryMonthYear)
            .NotEmpty()
            .Matches(ExpiryPattern)
            .WithMessage("Son kullanma tarihi AA/YY formatında olmalıdır.");

        RuleFor(x => x.Cvv)
            .NotEmpty()
            .Matches(@"^\d{3,4}$")
            .WithMessage("Güvenlik kodu 3-4 hane olmalıdır.");
    }
}

public sealed class PayDebtCommandHandler(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider,
    IOptions<PaymentOptions> paymentOptions) : IRequestHandler<PayDebtCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(PayDebtCommand request, CancellationToken cancellationToken)
    {
        var debtRepository = unitOfWork.Repository<Debt>();
        var debt = await debtRepository.GetByIdAsync(request.DebtId, cancellationToken).ConfigureAwait(false);

        if (debt is null)
        {
            return Result<Guid>.Failure($"'{request.DebtId}' kimlikli borç bulunamadı.");
        }

        if (debt.DebtorUserId != request.PayerUserId)
        {
            return Result<Guid>.Failure("Bu borç, ödeme yapan kullanıcıya ait değildir.");
        }

        var now = dateTimeProvider.UtcNow;
        var totalPayable = debt.CalculateTotalPayable(now, paymentOptions.Value.DailyOverdueInterestRatePercent);

        var payment = Payment.Create(debt.Id, request.PayerUserId, totalPayable, request.CardHolderName, request.CardNumber);

        try
        {
            debt.MarkAsPaid(payment.Id, now);
        }
        catch (DebtAlreadyPaidException ex)
        {
            return Result<Guid>.Failure(ex.Message);
        }

        await unitOfWork.Repository<Payment>().AddAsync(payment, cancellationToken).ConfigureAwait(false);
        debtRepository.Update(debt);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(payment.Id);
    }
}
