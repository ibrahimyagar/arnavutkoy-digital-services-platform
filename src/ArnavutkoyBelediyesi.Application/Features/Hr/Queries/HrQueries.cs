using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Hr.Dtos;
using ArnavutkoyBelediyesi.Domain.Hr;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Hr.Queries;

public sealed record GetDepartmentsQuery(bool ActiveOnly = true) : IRequest<Result<IReadOnlyCollection<DepartmentDto>>>;

public sealed class GetDepartmentsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetDepartmentsQuery, Result<IReadOnlyCollection<DepartmentDto>>>
{
    public async Task<Result<IReadOnlyCollection<DepartmentDto>>> Handle(
        GetDepartmentsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<Department>().Query();
        if (request.ActiveOnly)
        {
            query = query.Where(d => d.IsActive);
        }

        var items = await query
            .OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description, d.IsActive))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<DepartmentDto>>.Success(items);
    }
}

public sealed record GetStaffMembersQuery(Guid? DepartmentId, bool ActiveOnly = true)
    : IRequest<Result<IReadOnlyCollection<StaffMemberDto>>>;

public sealed class GetStaffMembersQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetStaffMembersQuery, Result<IReadOnlyCollection<StaffMemberDto>>>
{
    public async Task<Result<IReadOnlyCollection<StaffMemberDto>>> Handle(
        GetStaffMembersQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<StaffMember>().Query();

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(s => s.DepartmentId == request.DepartmentId.Value);
        }

        if (request.ActiveOnly)
        {
            query = query.Where(s => s.IsActive);
        }

        var items = await query
            .OrderBy(s => s.FullName)
            .Select(s => new StaffMemberDto(
                s.Id,
                s.DepartmentId,
                s.FullName,
                s.Title,
                s.Email,
                s.PhoneNumber,
                s.IsActive))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<StaffMemberDto>>.Success(items);
    }
}
