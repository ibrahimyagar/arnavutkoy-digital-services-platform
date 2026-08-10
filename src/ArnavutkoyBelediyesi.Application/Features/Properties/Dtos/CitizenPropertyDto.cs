using ArnavutkoyBelediyesi.Domain.Properties;

namespace ArnavutkoyBelediyesi.Application.Features.Properties.Dtos;

/// <summary>
/// Vatandaş mülkünün API görünümü.
/// </summary>
public sealed record CitizenPropertyDto(
    Guid Id,
    Guid OwnerUserId,
    Guid NeighborhoodId,
    Guid? StreetId,
    PropertyType Type,
    string Title,
    string DoorNumber,
    string BlockParcel,
    bool IsActive);
