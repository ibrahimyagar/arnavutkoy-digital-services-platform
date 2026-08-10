namespace ArnavutkoyBelediyesi.Api.Controllers.V1.Requests;

public sealed record CreateBusLineRequest(string Code, string Name, string? RouteSummary, decimal BaseFare);

public sealed record IssueTransportCardRequest(string CardNumber, decimal InitialBalance = 0);

public sealed record TopUpTransportCardRequest(decimal Amount);

public sealed record BoardBusRequest(Guid BusLineId);
