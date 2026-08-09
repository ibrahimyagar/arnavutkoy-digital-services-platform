using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Common;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

/// <summary>
/// Vatandaş rolünde yeni bir kullanıcı hesabı oluşturur. T.C. Kimlik Numarası, giriş kullanıcı
/// adı olarak kullanılacağından biçimsel geçerliliği sunucu tarafında (checksum dahil) doğrulanır.
/// </summary>
public sealed record RegisterCitizenCommand(string NationalId, string FullName, string PhoneNumber, string Password)
    : IRequest<Result<Guid>>;

public sealed class RegisterCitizenCommandValidator : AbstractValidator<RegisterCitizenCommand>
{
    public RegisterCitizenCommandValidator()
    {
        RuleFor(x => x.NationalId)
            .NotEmpty()
            .Must(TurkishNationalIdValidator.IsValid)
            .WithMessage("Geçerli bir T.C. Kimlik Numarası girilmelidir.");

        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);

        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .Matches(@"^\+?\d{10,15}$")
            .WithMessage("Geçerli bir telefon numarası girilmelidir.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .Matches("[A-Za-z]").WithMessage("Parola en az bir harf içermelidir.")
            .Matches(@"\d").WithMessage("Parola en az bir rakam içermelidir.");
    }
}

public sealed class RegisterCitizenCommandHandler(IIdentityService identityService)
    : IRequestHandler<RegisterCitizenCommand, Result<Guid>>
{
    public Task<Result<Guid>> Handle(RegisterCitizenCommand request, CancellationToken cancellationToken) =>
        identityService.CreateCitizenAsync(request.NationalId, request.FullName, request.PhoneNumber, request.Password, cancellationToken);
}
