namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

/// <summary>
/// Yeni bir ilçe oluşturma isteği gövdesi.
/// </summary>
public sealed record CreateDistrictRequest(string Name);

/// <summary>
/// Yeni bir mahalle oluşturma isteği gövdesi.
/// </summary>
public sealed record CreateNeighborhoodRequest(
    Guid DistrictId,
    string Name,
    string HeadmanFullName,
    string HeadmanPhoneNumber,
    int Population);

/// <summary>
/// Yeni bir sokak oluşturma isteği gövdesi.
/// </summary>
public sealed record CreateStreetRequest(Guid NeighborhoodId, string Name);
