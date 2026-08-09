using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Yeni bir vatandaş talebi oluşturma isteği gövdesi.
/// </summary>
public sealed record CreateCitizenRequestRequest(Guid CitizenUserId, Guid CategoryId, string InitialMessage);

/// <summary>
/// Bir talebe mesaj ekleme isteği gövdesi.
/// </summary>
public sealed record AddRequestMessageRequest(Guid SenderUserId, SenderType SenderType, string Message);
