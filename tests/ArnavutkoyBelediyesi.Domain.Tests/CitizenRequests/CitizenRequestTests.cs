using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.CitizenRequests.Events;
using ArnavutkoyBelediyesi.Domain.Exceptions;

namespace ArnavutkoyBelediyesi.Domain.Tests.CitizenRequests;

public sealed class CitizenRequestTests
{
    private static readonly Guid CitizenUserId = Guid.NewGuid();
    private static readonly Guid CategoryId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidData_ShouldStartAsPendingWithInitialMessage()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "Sokak lambası bozuk.");

        request.CitizenUserId.Should().Be(CitizenUserId);
        request.CategoryId.Should().Be(CategoryId);
        request.Status.Should().Be(RequestStatus.Pending);
        request.Messages.Should().ContainSingle();
        request.Messages.Single().SenderType.Should().Be(SenderType.Citizen);
        request.Messages.Single().Message.Should().Be("Sokak lambası bozuk.");
        request.DomainEvents.Should().ContainSingle().Which.Should().BeOfType<CitizenRequestCreatedDomainEvent>();
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankMessage_ShouldThrow(string message)
    {
        var act = () => CitizenRequest.Create(CitizenUserId, CategoryId, message);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void AddMessage_WhenNotClosed_ShouldAppendToMessages()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        var officerId = Guid.NewGuid();

        request.AddMessage(officerId, SenderType.Officer, "İnceleniyor.");

        request.Messages.Should().HaveCount(2);
        request.Messages.Last().SenderType.Should().Be(SenderType.Officer);
        request.Messages.Last().Message.Should().Be("İnceleniyor.");
    }

    [Fact]
    public void AddMessage_WhenClosed_ShouldThrowInvalidRequestStatusTransitionException()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        request.Close();

        var act = () => request.AddMessage(Guid.NewGuid(), SenderType.Officer, "Çok geç.");

        act.Should().Throw<InvalidRequestStatusTransitionException>();
    }

    [Fact]
    public void MarkUnderReview_WhenPending_ShouldTransitionToUnderReview()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");

        request.MarkUnderReview();

        request.Status.Should().Be(RequestStatus.UnderReview);
    }

    [Fact]
    public void MarkUnderReview_WhenNotPending_ShouldThrow()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        request.MarkUnderReview();

        var act = () => request.MarkUnderReview();

        act.Should().Throw<InvalidRequestStatusTransitionException>();
    }

    [Fact]
    public void Resolve_WhenPendingOrUnderReview_ShouldTransitionToResolvedAndSetTimestamp()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        var resolvedAt = DateTime.UtcNow;

        request.Resolve(resolvedAt);

        request.Status.Should().Be(RequestStatus.Resolved);
        request.ResolvedAtUtc.Should().Be(resolvedAt);
    }

    [Fact]
    public void Resolve_WhenAlreadyResolved_ShouldThrow()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        request.Resolve(DateTime.UtcNow);

        var act = () => request.Resolve(DateTime.UtcNow);

        act.Should().Throw<InvalidRequestStatusTransitionException>();
    }

    [Fact]
    public void Resolve_WhenClosed_ShouldThrow()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        request.Close();

        var act = () => request.Resolve(DateTime.UtcNow);

        act.Should().Throw<InvalidRequestStatusTransitionException>();
    }

    [Fact]
    public void Close_WhenNotClosed_ShouldTransitionToClosed()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");

        request.Close();

        request.Status.Should().Be(RequestStatus.Closed);
    }

    [Fact]
    public void Close_WhenAlreadyClosed_ShouldThrow()
    {
        var request = CitizenRequest.Create(CitizenUserId, CategoryId, "İlk mesaj.");
        request.Close();

        var act = request.Close;

        act.Should().Throw<InvalidRequestStatusTransitionException>();
    }
}
