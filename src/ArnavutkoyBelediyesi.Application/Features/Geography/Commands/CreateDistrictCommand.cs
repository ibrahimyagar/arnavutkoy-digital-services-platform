using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Geography;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Geography.Commands;

/// <summary>
/// Yeni bir ilçe oluşturur. Yalnızca Administrator rolü tarafından çağrılabilir (API katmanında yetkilendirilir).
/// </summary>
public sealed record CreateDistrictCommand(string Name) : IRequest<Result<Guid>>;

public sealed class CreateDistrictCommandValidator : AbstractValidator<CreateDistrictCommand>
{
    public CreateDistrictCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public sealed class CreateDistrictCommandHandler(IUnitOfWork unitOfWork) : IRequestHandler<CreateDistrictCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateDistrictCommand request, CancellationToken cancellationToken)
    {
        var district = District.Create(request.Name);

        await unitOfWork.Repository<District>().AddAsync(district, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(district.Id);
    }
}
