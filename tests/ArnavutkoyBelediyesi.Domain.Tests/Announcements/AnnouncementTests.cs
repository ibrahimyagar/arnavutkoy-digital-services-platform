using ArnavutkoyBelediyesi.Domain.Announcements;

namespace ArnavutkoyBelediyesi.Domain.Tests.Announcements;

public sealed class AnnouncementTests
{
    [Fact]
    public void CreateDraft_WithValidData_ShouldStartAsDraft()
    {
        var announcement = Announcement.CreateDraft("Yol Çalışması", "Pazartesi günü yol kapatılacaktır.", null);

        announcement.Status.Should().Be(AnnouncementStatus.Draft);
        announcement.Title.Should().Be("Yol Çalışması");
        announcement.PublishStartUtc.Should().BeNull();
    }

    [Theory]
    [InlineData("", "İçerik")]
    [InlineData("   ", "İçerik")]
    [InlineData("Başlık", "")]
    [InlineData("Başlık", "   ")]
    public void CreateDraft_WithBlankTitleOrContent_ShouldThrow(string title, string content)
    {
        var act = () => Announcement.CreateDraft(title, content, null);

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void CreateDraft_WithPastPublishEndDate_ShouldThrow()
    {
        var act = () => Announcement.CreateDraft("Başlık", "İçerik", DateTime.UtcNow.AddDays(-1));

        act.Should().Throw<ArgumentException>();
    }

    [Fact]
    public void Publish_WhenDraft_ShouldTransitionToPublishedAndSetStartDate()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        var now = DateTime.UtcNow;

        announcement.Publish(now);

        announcement.Status.Should().Be(AnnouncementStatus.Published);
        announcement.PublishStartUtc.Should().Be(now);
    }

    [Fact]
    public void Publish_WhenArchived_ShouldThrow()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);
        announcement.Archive();

        var act = () => announcement.Publish(DateTime.UtcNow);

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void Archive_WhenPublished_ShouldTransitionToArchived()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);

        announcement.Archive();

        announcement.Status.Should().Be(AnnouncementStatus.Archived);
    }

    [Fact]
    public void UpdateContent_WhenDraft_ShouldUpdateTitleAndContent()
    {
        var announcement = Announcement.CreateDraft("Eski Başlık", "Eski İçerik", null);

        announcement.UpdateContent("Yeni Başlık", "Yeni İçerik");

        announcement.Title.Should().Be("Yeni Başlık");
        announcement.Content.Should().Be("Yeni İçerik");
    }

    [Fact]
    public void UpdateContent_WhenPublished_ShouldThrow()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);

        var act = () => announcement.UpdateContent("Yeni Başlık", "Yeni İçerik");

        act.Should().Throw<InvalidOperationException>();
    }

    [Fact]
    public void IsVisible_WhenDraft_ShouldReturnFalse()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);

        announcement.IsVisible(DateTime.UtcNow).Should().BeFalse();
    }

    [Fact]
    public void IsVisible_WhenPublishedWithoutEndDate_ShouldReturnTrue()
    {
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", null);
        announcement.Publish(DateTime.UtcNow);

        announcement.IsVisible(DateTime.UtcNow.AddYears(1)).Should().BeTrue();
    }

    [Fact]
    public void IsVisible_WhenPublishedAndPastEndDate_ShouldReturnFalse()
    {
        var publishEnd = DateTime.UtcNow.AddDays(5);
        var announcement = Announcement.CreateDraft("Başlık", "İçerik", publishEnd);
        announcement.Publish(DateTime.UtcNow);

        announcement.IsVisible(publishEnd.AddDays(1)).Should().BeFalse();
    }
}
