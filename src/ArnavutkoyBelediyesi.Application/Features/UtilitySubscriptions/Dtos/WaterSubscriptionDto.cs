using ArnavutkoyBelediyesi.Domain.UtilitySubscriptions;

namespace ArnavutkoyBelediyesi.Application.Features.UtilitySubscriptions.Dtos;

/// <summary>
/// Su aboneliğinin API görünümü.
/// </summary>
public sealed record WaterSubscriptionDto(
    Guid Id,
    Guid SubscriberUserId,
    Guid NeighborhoodId,
    Guid? PropertyId,
    string SubscriptionNumber,
    WaterSubscriptionStatus Status,
    DateTime ActivatedAtUtc,
    DateTime? ClosedAtUtc);
