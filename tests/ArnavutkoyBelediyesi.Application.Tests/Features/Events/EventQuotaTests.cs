using ArnavutkoyBelediyesi.Application.Features.Events;

namespace ArnavutkoyBelediyesi.Application.Tests.Features.Events;

public sealed class EventQuotaTests
{
    [Fact]
    public void TryParse_ReadsFirstNumberFromKontenjanLine()
    {
        EventQuota.TryParse("Ücret: Ücretsiz\nKontenjan: 24 öğrenci\n").Should().Be(24);
    }

    [Fact]
    public void TryParse_WithoutNumber_ReturnsNull()
    {
        EventQuota.TryParse("Kontenjan: Alan kapasitesi").Should().BeNull();
    }

    [Fact]
    public void TryParse_WithoutLine_ReturnsNull()
    {
        EventQuota.TryParse("Sadece açıklama metni.").Should().BeNull();
    }
}
