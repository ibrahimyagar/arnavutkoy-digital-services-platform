using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Hr.Dtos;
using ArnavutkoyBelediyesi.Domain.Hr;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Hr.Commands;

public sealed record CreateDepartmentCommand(string Name, string Description) : IRequest<Result<Guid>>;

public sealed class CreateDepartmentCommandValidator : AbstractValidator<CreateDepartmentCommand>
{
    public CreateDepartmentCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Description).MaximumLength(500);
    }
}

public sealed class CreateDepartmentCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateDepartmentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var exists = await unitOfWork.Repository<Department>().Query()
            .AnyAsync(d => d.Name == name, cancellationToken)
            .ConfigureAwait(false);

        if (exists)
        {
            return Result<Guid>.Failure($"'{name}' adlı departman zaten var.");
        }

        var department = Department.Create(request.Name, request.Description);
        await unitOfWork.Repository<Department>().AddAsync(department, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(department.Id);
    }
}

public sealed record CreateStaffMemberCommand(
    Guid DepartmentId,
    string FullName,
    string Title,
    string Email,
    string PhoneNumber) : IRequest<Result<Guid>>;

public sealed class CreateStaffMemberCommandValidator : AbstractValidator<CreateStaffMemberCommand>
{
    public CreateStaffMemberCommandValidator()
    {
        RuleFor(x => x.DepartmentId).NotEmpty();
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Title).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).MaximumLength(200);
        RuleFor(x => x.PhoneNumber).MaximumLength(20);
    }
}

public sealed class CreateStaffMemberCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateStaffMemberCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateStaffMemberCommand request, CancellationToken cancellationToken)
    {
        var department = await unitOfWork.Repository<Department>()
            .GetByIdAsync(request.DepartmentId, cancellationToken)
            .ConfigureAwait(false);

        if (department is null || !department.IsActive)
        {
            return Result<Guid>.Failure("Seçilen departman geçersiz veya pasif.");
        }

        var staff = StaffMember.Create(
            request.DepartmentId,
            request.FullName,
            request.Title,
            request.Email,
            request.PhoneNumber);

        await unitOfWork.Repository<StaffMember>().AddAsync(staff, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(staff.Id);
    }
}
