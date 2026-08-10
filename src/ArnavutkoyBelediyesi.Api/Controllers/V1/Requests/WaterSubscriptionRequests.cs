namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Su aboneliği açma isteği.
/// </summary>
public sealed record OpenWaterSubscriptionRequest(
    Guid NeighborhoodId,
    Guid? PropertyId,
    string SubscriptionNumber);

/// <summary>
/// Abonelik üzerinden su borcu oluşturma isteği.
/// </summary>
public sealed record CreateWaterDebtRequest(decimal PrincipalAmount, DateTime DueDateUtc);
