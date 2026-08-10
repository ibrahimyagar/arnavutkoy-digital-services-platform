namespace ArnavutkoyBelediyesi.Application.Features.Transportation.Dtos;

public sealed record TransportCardDto(Guid Id, Guid OwnerUserId, string CardNumber, decimal Balance, bool IsActive);

public sealed record BusLineDto(Guid Id, string Code, string Name, string RouteSummary, decimal BaseFare, bool IsActive);

public sealed record BoardingRecordDto(
    Guid Id,
    Guid TransportCardId,
    Guid BusLineId,
    decimal FareCharged,
    DateTime BoardedAtUtc);
