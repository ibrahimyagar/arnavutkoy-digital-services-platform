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
    string NationalId,
    DateOnly BirthDate,
    string Gender,
    string Password) : IRequest<Result<Guid>>;

public sealed class RegisterCitizenCommandValidator : AbstractValidator<RegisterCitizenCommand>
{
    public RegisterCitizenCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .Matches(@"^\+?\d{10,15}$")
            .WithMessage("Geçerli bir telefon numarası girilmelidir.");

        RuleFor(x => x.NationalId)
            .NotEmpty()
            .Must(TurkishNationalIdValidator.IsValid)
            .WithMessage("Geçerli bir T.C. Kimlik Numarası girilmelidir.");

        RuleFor(x => x.BirthDate)
            .Must(BeAtLeast18)
            .WithMessage("Kayıt için 18 yaşında olmalısınız.");

        RuleFor(x => x.Gender)
            .NotEmpty()
            .Must(g => g is "E" or "K" or "e" or "k")
            .WithMessage("Cinsiyet E veya K olmalıdır.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Za-z]").WithMessage("Parola en az bir harf içermelidir.")
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
