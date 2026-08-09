using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Commands;

/// <summary>
/// Belirtilen ilçeye bağlı yeni bir mahalle oluşturur. Yalnızca Administrator rolü tarafından
/// çağrılabilir (API katmanında yetkilendirilir).
/// </summary>
public sealed record CreateNeighborhoodCommand(
    Guid DistrictId,
    string Name,
    string HeadmanFullName,
    string HeadmanPhoneNumber,
    int Population) : IRequest<Result<Guid>>;

public sealed class CreateNeighborhoodCommandValidator : AbstractValidator<CreateNeighborhoodCommand>
{
    public CreateNeighborhoodCommandValidator()
    {
        RuleFor(x => x.DistrictId).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.HeadmanFullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.HeadmanPhoneNumber).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Population).GreaterThanOrEqualTo(0);
    }
}

public sealed class CreateNeighborhoodCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateNeighborhoodCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateNeighborhoodCommand request, CancellationToken cancellationToken)
    {
        var district = await unitOfWork.Repository<District>()
            .GetByIdAsync(request.DistrictId, cancellationToken)
            .ConfigureAwait(false);

        if (district is null)
        {
            return Result<Guid>.Failure($"'{request.DistrictId}' kimlikli ilçe bulunamadı.");
        }

        var neighborhood = Neighborhood.Create(
            request.DistrictId,
            request.Name,
            request.HeadmanFullName,
            request.HeadmanPhoneNumber,
            request.Population);

        await unitOfWork.Repository<Neighborhood>().AddAsync(neighborhood, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(neighborhood.Id);
    }
}
