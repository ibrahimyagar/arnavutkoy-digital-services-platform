namespace ArnavutkoyBelediyesi.Application.Features.Geography.Dtos;

/// <summary>
/// Bir ilçenin API'ye sunulan özet görünümü.
/// </summary>
public sealed record DistrictDto(Guid Id, string Name, int NeighborhoodCount);

/// <summary>
/// Bir mahallenin API'ye sunulan görünümü.
/// </summary>
public sealed record NeighborhoodDto(
    Guid Id,
    Guid DistrictId,
    string Name,
    string HeadmanFullName,
    string HeadmanPhoneNumber,
    int Population);
