using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Auth.Commands;

public sealed record UpdateMyPhoneCommand(Guid UserId, string PhoneNumber) : IRequest<Result>;

public sealed class UpdateMyPhoneCommandValidator : AbstractValidator<UpdateMyPhoneCommand>
{
    public UpdateMyPhoneCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty();
        RuleFor(x => x.PhoneNumber)
            .NotEmpty()
            .MaximumLength(20)
            .Matches(@"^\+?\d{10,15}$")
            .WithMessage("Geçerli bir telefon numarası girilmelidir.");
    }
}

public sealed class UpdateMyPhoneCommandHandler(IIdentityService identityService)
    : IRequestHandler<UpdateMyPhoneCommand, Result>
{
    public Task<Result> Handle(UpdateMyPhoneCommand request, CancellationToken cancellationToken) =>
        identityService.UpdatePhoneNumberAsync(request.UserId, request.PhoneNumber, cancellationToken);
}
