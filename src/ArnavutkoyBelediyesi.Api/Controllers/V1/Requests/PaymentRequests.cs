namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Bir borcu ödeme isteği gövdesi. Ödeyen kullanıcı istekten değil, kimliği doğrulanmış geçerli
/// kullanıcıdan (JWT) alınır. <see cref="Cvv"/> yalnızca doğrulama amaçlıdır, hiçbir zaman
/// kalıcı hale getirilmez veya loglanmaz.
/// </summary>
public sealed record PayDebtRequest(
    string CardHolderName,
    string CardNumber,
    string ExpiryMonthYear,
    string Cvv);
