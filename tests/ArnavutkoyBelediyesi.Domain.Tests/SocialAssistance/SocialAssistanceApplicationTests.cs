using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using FluentAssertions;

namespace ArnavutkoyBelediyesi.Domain.Tests.SocialAssistance;

public sealed class SocialAssistanceApplicationTests
{
    [Fact]
    public void Submit_ThenApprove_Works()
    {
        var app = SocialAssistanceApplication.Submit(
            Guid.NewGuid(), AssistanceType.Food, 4, 12000m, "4 kişilik hane", null, DateTime.UtcNow);

        app.StartReview(Guid.NewGuid());
        app.Approve(Guid.NewGuid(), "Uygun", DateTime.UtcNow);

        app.Status.Should().Be(SocialAssistanceApplicationStatus.Approved);
    }

    [Fact]
    public void Reject_RequiresNote()
    {
        var app = SocialAssistanceApplication.Submit(
            Guid.NewGuid(), AssistanceType.Heating, 2, 8000m, "2 kişi", "{}", DateTime.UtcNow);

        var act = () => app.Reject(Guid.NewGuid(), "  ", DateTime.UtcNow);
        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Withdraw_AfterApprove_Throws()
    {
        var app = SocialAssistanceApplication.Submit(
            Guid.NewGuid(), AssistanceType.Other, 1, 0m, "tek kişi", null, DateTime.UtcNow);
        app.Approve(Guid.NewGuid(), null, DateTime.UtcNow);

        var act = () => app.Withdraw();
        act.Should().Throw<InvalidSocialAssistanceTransitionException>();
    }
}
