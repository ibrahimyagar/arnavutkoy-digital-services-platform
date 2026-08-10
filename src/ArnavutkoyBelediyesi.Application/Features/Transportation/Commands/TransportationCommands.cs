using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.Transportation;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Transportation.Commands;

public sealed record IssueTransportCardCommand(Guid OwnerUserId, string CardNumber, decimal InitialBalance = 0)
    : IRequest<Result<Guid>>;

public sealed class IssueTransportCardCommandValidator : AbstractValidator<IssueTransportCardCommand>
{
    public IssueTransportCardCommandValidator()
    {
        RuleFor(x => x.OwnerUserId).NotEmpty();
        RuleFor(x => x.CardNumber).NotEmpty().MaximumLength(30);
        RuleFor(x => x.InitialBalance).GreaterThanOrEqualTo(0);
    }
}

public sealed class IssueTransportCardCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<IssueTransportCardCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(IssueTransportCardCommand request, CancellationToken cancellationToken)
    {
        var number = request.CardNumber.Trim().ToUpperInvariant();
        var exists = await unitOfWork.Repository<TransportCard>().Query()
            .AnyAsync(c => c.CardNumber == number, cancellationToken)
            .ConfigureAwait(false);

        if (exists)
        {
            return Result<Guid>.Failure($"'{number}' kart numarası zaten kayıtlı.");
        }

        var card = TransportCard.Issue(request.OwnerUserId, request.CardNumber, request.InitialBalance);
        await unitOfWork.Repository<TransportCard>().AddAsync(card, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(card.Id);
    }
}

public sealed record TopUpTransportCardCommand(Guid CardId, decimal Amount) : IRequest<Result>;

public sealed class TopUpTransportCardCommandValidator : AbstractValidator<TopUpTransportCardCommand>
{
    public TopUpTransportCardCommandValidator()
    {
        RuleFor(x => x.CardId).NotEmpty();
        RuleFor(x => x.Amount).GreaterThan(0);
    }
}

public sealed class TopUpTransportCardCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<TopUpTransportCardCommand, Result>
{
    public async Task<Result> Handle(TopUpTransportCardCommand request, CancellationToken cancellationToken)
    {
        var card = await unitOfWork.Repository<TransportCard>()
            .GetByIdAsync(request.CardId, cancellationToken)
            .ConfigureAwait(false);

        if (card is null)
        {
            return Result.Failure("Kart bulunamadı.");
        }

        try
        {
            card.TopUp(request.Amount);
        }
        catch (Exception ex) when (ex is DomainException or ArgumentOutOfRangeException)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<TransportCard>().Update(card);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record CreateBusLineCommand(string Code, string Name, string RouteSummary, decimal BaseFare)
    : IRequest<Result<Guid>>;

public sealed class CreateBusLineCommandValidator : AbstractValidator<CreateBusLineCommand>
{
    public CreateBusLineCommandValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.RouteSummary).MaximumLength(500);
        RuleFor(x => x.BaseFare).GreaterThan(0);
    }
}

public sealed class CreateBusLineCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateBusLineCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateBusLineCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var exists = await unitOfWork.Repository<BusLine>().Query()
            .AnyAsync(l => l.Code == code, cancellationToken)
            .ConfigureAwait(false);

        if (exists)
        {
            return Result<Guid>.Failure($"'{code}' hat kodu zaten var.");
        }

        var line = BusLine.Create(request.Code, request.Name, request.RouteSummary, request.BaseFare);
        await unitOfWork.Repository<BusLine>().AddAsync(line, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(line.Id);
    }
}

public sealed record BoardBusCommand(Guid CardId, Guid BusLineId) : IRequest<Result<Guid>>;

public sealed class BoardBusCommandValidator : AbstractValidator<BoardBusCommand>
{
    public BoardBusCommandValidator()
    {
        RuleFor(x => x.CardId).NotEmpty();
        RuleFor(x => x.BusLineId).NotEmpty();
    }
}

public sealed class BoardBusCommandHandler(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
    : IRequestHandler<BoardBusCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(BoardBusCommand request, CancellationToken cancellationToken)
    {
        var card = await unitOfWork.Repository<TransportCard>()
            .GetByIdAsync(request.CardId, cancellationToken)
            .ConfigureAwait(false);

        if (card is null)
        {
            return Result<Guid>.Failure("Kart bulunamadı.");
        }

        var line = await unitOfWork.Repository<BusLine>()
            .GetByIdAsync(request.BusLineId, cancellationToken)
            .ConfigureAwait(false);

        if (line is null || !line.IsActive)
        {
            return Result<Guid>.Failure("Hat bulunamadı veya pasif.");
        }

        try
        {
            card.ChargeFare(line.BaseFare);
        }
        catch (DomainException ex)
        {
            return Result<Guid>.Failure(ex.Message);
        }

        var boarding = BoardingRecord.Create(card.Id, line.Id, line.BaseFare, dateTimeProvider.UtcNow);
        unitOfWork.Repository<TransportCard>().Update(card);
        await unitOfWork.Repository<BoardingRecord>().AddAsync(boarding, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(boarding.Id);
    }
}

public sealed record AddBusLineStopCommand(Guid BusLineId, int Sequence, string Name) : IRequest<Result<Guid>>;

public sealed class AddBusLineStopCommandValidator : AbstractValidator<AddBusLineStopCommand>
{
    public AddBusLineStopCommandValidator()
    {
        RuleFor(x => x.BusLineId).NotEmpty();
        RuleFor(x => x.Sequence).GreaterThanOrEqualTo(1);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
    }
}

public sealed class AddBusLineStopCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<AddBusLineStopCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddBusLineStopCommand request, CancellationToken cancellationToken)
    {
        var line = await unitOfWork.Repository<BusLine>()
            .GetByIdAsync(request.BusLineId, cancellationToken)
            .ConfigureAwait(false);

        if (line is null)
        {
            return Result<Guid>.Failure("Hat bulunamadı.");
        }

        var duplicate = await unitOfWork.Repository<BusLineStop>().Query()
            .AnyAsync(s => s.BusLineId == request.BusLineId && s.Sequence == request.Sequence, cancellationToken)
            .ConfigureAwait(false);

        if (duplicate)
        {
            return Result<Guid>.Failure($"Bu hatta {request.Sequence}. sıra zaten tanımlı.");
        }

        var stop = BusLineStop.Create(request.BusLineId, request.Sequence, request.Name);
        await unitOfWork.Repository<BusLineStop>().AddAsync(stop, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(stop.Id);
    }
}

public sealed record AddBusLineDepartureCommand(
    Guid BusLineId,
    DayOfWeek DayOfWeek,
    TimeOnly DepartureTime,
    string? Note) : IRequest<Result<Guid>>;

public sealed class AddBusLineDepartureCommandValidator : AbstractValidator<AddBusLineDepartureCommand>
{
    public AddBusLineDepartureCommandValidator()
    {
        RuleFor(x => x.BusLineId).NotEmpty();
        RuleFor(x => x.DayOfWeek).IsInEnum();
        RuleFor(x => x.Note).MaximumLength(200);
    }
}

public sealed class AddBusLineDepartureCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<AddBusLineDepartureCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddBusLineDepartureCommand request, CancellationToken cancellationToken)
    {
        var line = await unitOfWork.Repository<BusLine>()
            .GetByIdAsync(request.BusLineId, cancellationToken)
            .ConfigureAwait(false);

        if (line is null)
        {
            return Result<Guid>.Failure("Hat bulunamadı.");
        }

        var departure = BusLineDeparture.Create(request.BusLineId, request.DayOfWeek, request.DepartureTime, request.Note);
        await unitOfWork.Repository<BusLineDeparture>().AddAsync(departure, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(departure.Id);
    }
}
