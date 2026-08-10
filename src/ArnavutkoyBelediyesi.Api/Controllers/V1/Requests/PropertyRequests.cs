using ArnavutkoyBelediyesi.Domain.Properties;

namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Vatandaş mülkü kayıt isteği.
/// </summary>
public sealed record RegisterCitizenPropertyRequest(
    Guid NeighborhoodId,
    Guid? StreetId,
    PropertyType Type,
    string Title,
    string DoorNumber,
    string? BlockParcel);

/// <summary>
/// Mülk adres güncelleme isteği.
/// </summary>
public sealed record UpdateCitizenPropertyAddressRequest(
    Guid NeighborhoodId,
    Guid? StreetId,
    string DoorNumber,
    string? BlockParcel);

/// <summary>
/// Aktif mülk için emlak vergisi borcu oluşturma isteği.
/// </summary>
public sealed record CreatePropertyDebtRequest(decimal PrincipalAmount, DateTime DueDateUtc);
