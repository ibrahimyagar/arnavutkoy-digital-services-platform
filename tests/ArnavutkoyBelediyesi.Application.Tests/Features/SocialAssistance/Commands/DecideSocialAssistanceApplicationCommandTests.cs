using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Commands;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.SocialAssistance.Commands;

public sealed class DecideSocialAssistanceApplicationCommandTests
{
    [Fact]
    public async Task Handle_Approve_UpdatesStatus()
    {
        var app = SocialAssistanceApplication.Submit(
            Guid.NewGuid(), AssistanceType.Education, 3, 9000m, "öğrenci hane", null, DateTime.UtcNow);
        var reviewer = Guid.NewGuid();
        var unitOfWork = Substitute.For<IUnitOfWork>();
        var repo = Substitute.For<IRepository<SocialAssistanceApplication>>();
        var clock = Substitute.For<IDateTimeProvider>();
        clock.UtcNow.Returns(DateTime.UtcNow);
        unitOfWork.Repository<SocialAssistanceApplication>().Returns(repo);
        repo.GetByIdAsync(app.Id, Arg.Any<CancellationToken>()).Returns(app);
        var handler = new DecideSocialAssistanceApplicationCommandHandler(unitOfWork, clock);

        var result = await handler.Handle(
            new DecideSocialAssistanceApplicationCommand(app.Id, reviewer, true, "OK"),
            CancellationToken.None);

        result.IsSuccess.Should().BeTrue();
        app.Status.Should().Be(SocialAssistanceApplicationStatus.Approved);
    }
}
