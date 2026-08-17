using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Common;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

public sealed record RegisterCitizenCommand(
    string Email,
    string FullName,
    string PhoneNumber,
    string? NationalId,
    DateOnly? BirthDate,
    string Gender,
    string Password) : IRequest<Result<Guid>>;

public sealed class RegisterCitizenCommandValidator : AbstractValidator<RegisterCitizenCommand>
{
    public RegisterCitizenCommandValidator()
    {
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .Must(email => !string.IsNullOrWhiteSpace(email))
            .WithMessage("E-posta zorunludur.")
            .Must(EmailNormalizer.IsValid)
            .WithMessage("Geçerli bir e-posta girilmelidir.")
            .MaximumLength(256);

        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .Must(PhoneNumberNormalizer.IsPlausible)
            .WithMessage("Geçerli bir telefon numarası girilmelidir.");

        RuleFor(x => x.NationalId)
            .Must(id => string.IsNullOrWhiteSpace(id) || TurkishNationalIdValidator.IsValid(id))
            .WithMessage("Geçerli bir T.C. Kimlik Numarası girilmelidir.");

        RuleFor(x => x.BirthDate)
            .Must(date => date is null || BeAtLeast18(date.Value))
            .WithMessage("Doğum tarihi girildiyse 18 yaşında olmalısınız.");

        RuleFor(x => x.Gender)
            .Must(g => string.IsNullOrWhiteSpace(g) || g is "E" or "K" or "e" or "k")
            .WithMessage("Cinsiyet E veya K olmalıdır.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-ZÇĞİÖŞÜ]").WithMessage("Parola en az bir büyük harf içermelidir.")
            .Matches("[a-zçğıöşü]").WithMessage("Parola en az bir küçük harf içermelidir.")
            .Matches(@"\d").WithMessage("Parola en az bir rakam içermelidir.");
    }

    private static bool BeAtLeast18(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - birthDate.Year;
        if (birthDate > today.AddYears(-age))
        {
            age--;
        }

        return age >= 18;
    }
}

public sealed class RegisterCitizenCommandHandler(IIdentityService identityService)
    : IRequestHandler<RegisterCitizenCommand, Result<Guid>>
{
    public Task<Result<Guid>> Handle(RegisterCitizenCommand request, CancellationToken cancellationToken) =>
        identityService.CreateCitizenAsync(
            request.Email,
            request.FullName,
            request.PhoneNumber,
            request.NationalId,
            request.BirthDate,
            request.Gender,
            request.Password,
            cancellationToken);
}
