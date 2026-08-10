using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.Hr.Commands;
using ArnavutkoyBelediyesi.Domain.Hr;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Hr.Commands;

public sealed class CreateStaffMemberCommandTests
{
    [Fact]
    public async Task Handle_WhenDepartmentMissing_ShouldFail()
    {
        var departmentId = Guid.NewGuid();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repo = Substitute.For<IRepository<Department>>();
        unitOfWork.Repository<Department>().Returns(repo);
        repo.GetByIdAsync(departmentId, Arg.Any<CancellationToken>()).Returns((Department?)null);
        var handler = new CreateStaffMemberCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreateStaffMemberCommand(departmentId, "Ali", "Memur", "a@b.com", "0555"),
            CancellationToken.None);

        result.IsSuccess.Should().BeFalse();
    }

    [Fact]
    public async Task Handle_WhenDepartmentActive_ShouldPersist()
    {
        var department = Department.Create("İmar", "İmar işleri");
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var deptRepo = Substitute.For<IRepository<Department>>();
        var staffRepo = Substitute.For<IRepository<StaffMember>>();
        unitOfWork.Repository<Department>().Returns(deptRepo);
        unitOfWork.Repository<StaffMember>().Returns(staffRepo);
        deptRepo.GetByIdAsync(department.Id, Arg.Any<CancellationToken>()).Returns(department);
        var handler = new CreateStaffMemberCommandHandler(unitOfWork);

        var result = await handler.Handle(
            new CreateStaffMemberCommand(department.Id, "Ayşe", "Müdür", "ayse@demo.local", "0555"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        await staffRepo.Received(1).AddAsync(Arg.Any<StaffMember>(), Arg.Any<CancellationToken>());
    }
}
