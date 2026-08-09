using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;

/// <summary>
/// Vatandaş adına yeni bir hizmet talebi oluşturur.
/// </summary>
public sealed record CreateCitizenRequestCommand(Guid CitizenUserId, Guid CategoryId, string InitialMessage)
    : IRequest<Result<Guid>>;

public sealed class CreateCitizenRequestCommandValidator : AbstractValidator<CreateCitizenRequestCommand>
{
    public CreateCitizenRequestCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.CategoryId).NotEmpty();
        RuleFor(x => x.InitialMessage).NotEmpty().MaximumLength(2000);
    }
}

public sealed class CreateCitizenRequestCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateCitizenRequestCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCitizenRequestCommand request, CancellationToken cancellationToken)
    {
        var category = await unitOfWork.Repository<RequestCategory>()
            .GetByIdAsync(request.CategoryId, cancellationToken)
            .ConfigureAwait(false);

        if (category is null || !category.IsActive)
        {
            return Result<Guid>.Failure("Seçilen talep kategorisi geçersiz veya artık aktif değil.");
        }

        var citizenRequest = CitizenRequest.Create(request.CitizenUserId, request.CategoryId, request.InitialMessage);

        await unitOfWork.Repository<CitizenRequest>().AddAsync(citizenRequest, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(citizenRequest.Id);
    }
}
