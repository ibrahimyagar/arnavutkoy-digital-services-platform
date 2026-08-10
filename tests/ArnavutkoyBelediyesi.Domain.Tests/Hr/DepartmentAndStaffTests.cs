using ArnavutkoyBelediyesi.Domain.Hr;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.Hr;

public sealed class DepartmentAndStaffTests
{
    [Fact]
    public void Department_Create_TrimsName()
    {
        var dept = Department.Create("  Fen İşleri  ", "Yol bakım");
        dept.Name.Should().Be("Fen İşleri");
        dept.IsActive.Should().BeTrue();
    }

    [Fact]
    public void StaffMember_Create_RequiresDepartment()
    {
        var act = () => StaffMember.Create(Guid.Empty, "Ali", "Memur", "a@b.com", "0555");
        act.Should().Throw<ArgumentException>().WithParameterName("departmentId");
    }

    [Fact]
    public void StaffMember_MoveToDepartment_UpdatesId()
    {
        var staff = StaffMember.Create(Guid.NewGuid(), "Ali Veli", "Uzman", "ali@demo.local", "+905551112233");
        var newDept = Guid.NewGuid();
        staff.MoveToDepartment(newDept);
        staff.DepartmentId.Should().Be(newDept);
    }
}
