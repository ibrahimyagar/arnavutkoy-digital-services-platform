namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Yeni bir vatandaş talebi oluşturma isteği gövdesi. Talep sahibi, istekten değil,
/// kimliği doğrulanmış geçerli kullanıcıdan (JWT) alınır.
/// </summary>
public sealed record CreateCitizenRequestRequest(Guid CategoryId, string InitialMessage);

/// <summary>
/// Bir talebe mesaj ekleme isteği gövdesi. Gönderen ve gönderen türü, istekten değil,
/// kimliği doğrulanmış geçerli kullanıcıdan (JWT) alınır; böylece bir kullanıcı başka bir
/// kullanıcı adına ya da sahte bir gönderen türüyle mesaj gönderemez.
/// </summary>
public sealed record AddRequestMessageRequest(string Message);
