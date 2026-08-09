using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;

/// <summary>
/// Bir talep mesajının API'ye sunulan görünümü.
/// </summary>
public sealed record RequestMessageDto(Guid Id, Guid SenderUserId, SenderType SenderType, string Message, DateTime SentAtUtc);

/// <summary>
/// Bir vatandaş talebinin, mesaj geçmişi dahil tam görünümü.
/// </summary>
public sealed record CitizenRequestDto(
    Guid Id,
    Guid CitizenUserId,
    Guid CategoryId,
    RequestStatus Status,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc,
    IReadOnlyCollection<RequestMessageDto> Messages);

/// <summary>
/// Liste görünümlerinde kullanılan, mesaj detayı içermeyen özet talep bilgisi.
/// </summary>
public sealed record CitizenRequestSummaryDto(
    Guid Id,
    Guid CategoryId,
    RequestStatus Status,
    DateTime CreatedAtUtc,
    DateTime? ResolvedAtUtc);

/// <summary>
/// Bir talep kategorisinin API'ye sunulan görünümü.
/// </summary>
public sealed record RequestCategoryDto(Guid Id, string Name);
