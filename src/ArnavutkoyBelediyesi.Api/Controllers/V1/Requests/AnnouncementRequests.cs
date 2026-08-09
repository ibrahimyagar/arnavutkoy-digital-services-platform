namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Yeni bir taslak duyuru oluşturma isteği gövdesi.
/// </summary>
public sealed record CreateAnnouncementRequest(string Title, string Content, DateTime? PublishEndUtc);

/// <summary>
/// Bir duyurunun başlık/içeriğini güncelleme isteği gövdesi.
/// </summary>
public sealed record UpdateAnnouncementRequest(string Title, string Content);
