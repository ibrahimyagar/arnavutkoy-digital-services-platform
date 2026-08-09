namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Bir borcu ödeme isteği gövdesi. <see cref="Cvv"/> yalnızca doğrulama amaçlıdır, hiçbir zaman
/// kalıcı hale getirilmez veya loglanmaz.
/// </summary>
public sealed record PayDebtRequest(
    Guid PayerUserId,
    string CardHolderName,
    string CardNumber,
    string ExpiryMonthYear,
    string Cvv);
