using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Transportation.Dtos;
using ArnavutkoyBelediyesi.Domain.Transportation;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Transportation.Queries;

public sealed record GetBusLinesQuery(bool ActiveOnly = true) : IRequest<Result<IReadOnlyCollection<BusLineDto>>>;

public sealed class GetBusLinesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetBusLinesQuery, Result<IReadOnlyCollection<BusLineDto>>>
{
    public async Task<Result<IReadOnlyCollection<BusLineDto>>> Handle(GetBusLinesQuery request, CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<BusLine>().Query();
        if (request.ActiveOnly)
        {
            query = query.Where(l => l.IsActive);
        }

        var items = await query
            .OrderBy(l => l.Code)
            .Select(l => new BusLineDto(l.Id, l.Code, l.Name, l.RouteSummary, l.BaseFare, l.IsActive))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<BusLineDto>>.Success(items);
    }
}

public sealed record GetMyTransportCardsQuery(Guid OwnerUserId) : IRequest<Result<IReadOnlyCollection<TransportCardDto>>>;

public sealed class GetMyTransportCardsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyTransportCardsQuery, Result<IReadOnlyCollection<TransportCardDto>>>
{
    public async Task<Result<IReadOnlyCollection<TransportCardDto>>> Handle(
        GetMyTransportCardsQuery request,
        CancellationToken cancellationToken)
    {
        var items = await unitOfWork.Repository<TransportCard>().Query()
            .Where(c => c.OwnerUserId == request.OwnerUserId)
            .OrderBy(c => c.CardNumber)
            .Select(c => new TransportCardDto(c.Id, c.OwnerUserId, c.CardNumber, c.Balance, c.IsActive))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<TransportCardDto>>.Success(items);
    }
}

public sealed record GetTransportCardByIdQuery(Guid CardId) : IRequest<Result<TransportCardDto>>;

public sealed class GetTransportCardByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetTransportCardByIdQuery, Result<TransportCardDto>>
{
    public async Task<Result<TransportCardDto>> Handle(GetTransportCardByIdQuery request, CancellationToken cancellationToken)
    {
        var card = await unitOfWork.Repository<TransportCard>()
            .GetByIdAsync(request.CardId, cancellationToken)
            .ConfigureAwait(false);

        if (card is null)
        {
            return Result<TransportCardDto>.Failure("Kart bulunamadı.");
        }

        return Result<TransportCardDto>.Success(
            new TransportCardDto(card.Id, card.OwnerUserId, card.CardNumber, card.Balance, card.IsActive));
    }
}

public sealed record GetMyBoardingsQuery(Guid OwnerUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<BoardingRecordDto>>>;

public sealed class GetMyBoardingsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMyBoardingsQuery, Result<PaginatedList<BoardingRecordDto>>>
{
    public async Task<Result<PaginatedList<BoardingRecordDto>>> Handle(
        GetMyBoardingsQuery request,
        CancellationToken cancellationToken)
    {
        var cardIds = await unitOfWork.Repository<TransportCard>().Query()
            .Where(c => c.OwnerUserId == request.OwnerUserId)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var query = unitOfWork.Repository<BoardingRecord>().Query()
            .Where(b => cardIds.Contains(b.TransportCardId))
            .OrderByDescending(b => b.BoardedAtUtc)
            .Select(b => new BoardingRecordDto(b.Id, b.TransportCardId, b.BusLineId, b.FareCharged, b.BoardedAtUtc));

        var page = await PaginatedList<BoardingRecordDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<BoardingRecordDto>>.Success(page);
    }
}

public sealed record GetBusLineByIdQuery(Guid BusLineId) : IRequest<Result<BusLineDetailsDto>>;

public sealed class GetBusLineByIdQueryValidator : AbstractValidator<GetBusLineByIdQuery>
{
    public GetBusLineByIdQueryValidator() => RuleFor(x => x.BusLineId).NotEmpty();
}

public sealed class GetBusLineByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetBusLineByIdQuery, Result<BusLineDetailsDto>>
{
    public async Task<Result<BusLineDetailsDto>> Handle(GetBusLineByIdQuery request, CancellationToken cancellationToken)
    {
        var line = await unitOfWork.Repository<BusLine>()
            .GetByIdAsync(request.BusLineId, cancellationToken)
            .ConfigureAwait(false);

        if (line is null)
        {
            return Result<BusLineDetailsDto>.Failure("Hat bulunamadı.");
        }

        var stops = await unitOfWork.Repository<BusLineStop>().Query()
            .Where(s => s.BusLineId == line.Id)
            .OrderBy(s => s.Sequence)
            .Select(s => new BusLineStopDto(s.Id, s.BusLineId, s.Sequence, s.Name))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var departures = await unitOfWork.Repository<BusLineDeparture>().Query()
            .Where(d => d.BusLineId == line.Id)
            .OrderBy(d => d.DayOfWeek)
            .ThenBy(d => d.DepartureTime)
            .Select(d => new BusLineDepartureDto(d.Id, d.BusLineId, d.DayOfWeek, d.DepartureTime, d.Note))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<BusLineDetailsDto>.Success(new BusLineDetailsDto(
            line.Id,
            line.Code,
            line.Name,
            line.RouteSummary,
            line.BaseFare,
            line.IsActive,
            stops,
            departures));
    }
}

public sealed record SearchBusStopsQuery(string Query, int Limit = 20) : IRequest<Result<IReadOnlyCollection<BusStopSearchResultDto>>>;

public sealed class SearchBusStopsQueryValidator : AbstractValidator<SearchBusStopsQuery>
{
    public SearchBusStopsQueryValidator()
    {
        RuleFor(x => x.Query).NotEmpty().MinimumLength(2);
        RuleFor(x => x.Limit).InclusiveBetween(1, 50);
    }
}

public sealed class SearchBusStopsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<SearchBusStopsQuery, Result<IReadOnlyCollection<BusStopSearchResultDto>>>
{
    public async Task<Result<IReadOnlyCollection<BusStopSearchResultDto>>> Handle(
        SearchBusStopsQuery request,
        CancellationToken cancellationToken)
    {
        var needle = request.Query.Trim();
        var normalized = needle.ToUpperInvariant();

        var results = await unitOfWork.Repository<BusLineStop>().Query()
            .Where(s => s.Name.ToUpper().Contains(normalized))
            .Join(
                unitOfWork.Repository<BusLine>().Query(),
                stop => stop.BusLineId,
                line => line.Id,
                (stop, line) => new { stop, line })
            .Where(x => x.line.IsActive)
            .OrderBy(x => x.stop.Name)
            .ThenBy(x => x.line.Code)
            .Take(request.Limit)
            .Select(x => new BusStopSearchResultDto(
                x.stop.Id,
                x.line.Id,
                x.line.Code,
                x.line.Name,
                x.stop.Sequence,
                x.stop.Name,
                x.line.IsActive))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyCollection<BusStopSearchResultDto>>.Success(results);
    }
}
