using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Portal;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Events;

public sealed record EventRegistrationDto(
    Guid Id,
    Guid EventId,
    string EventTitle,
    string? EventLocation,
    string? EventCategory,
    DateTime? StartsAtUtc,
    DateTime? EndsAtUtc,
    string Status,
    DateTime RegisteredAtUtc,
    DateTime? CancelledAtUtc);

public sealed record EventRegistrationStatusDto(
    Guid EventId,
    bool IsRegistered,
    Guid? RegistrationId,
    string? Status,
    int RegisteredCount,
    int? Quota,
    int? Remaining);

public sealed record RegisterForEventCommand(Guid CitizenUserId, Guid EventId)
    : IRequest<Result<EventRegistrationDto>>;

public sealed class RegisterForEventCommandValidator : AbstractValidator<RegisterForEventCommand>
{
    public RegisterForEventCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.EventId).NotEmpty();
    }
}

public sealed class RegisterForEventCommandHandler(IUnitOfWork unitOfWork, IDateTimeProvider clock)
    : IRequestHandler<RegisterForEventCommand, Result<EventRegistrationDto>>
{
    public async Task<Result<EventRegistrationDto>> Handle(
        RegisterForEventCommand request,
        CancellationToken cancellationToken)
    {
        var portalEvent = await unitOfWork.Repository<PortalContent>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.Id == request.EventId && x.Kind == PortalContentKind.Event && x.IsPublished,
                cancellationToken)
            .ConfigureAwait(false);

        if (portalEvent is null)
        {
            return Result<EventRegistrationDto>.Failure("Etkinlik bulunamadı.");
        }

        var now = clock.UtcNow;
        var ends = portalEvent.EndsAtUtc ?? portalEvent.StartsAtUtc;
        if (ends is not null && ends < now)
        {
            return Result<EventRegistrationDto>.Failure("Bu etkinlik sona erdi; kayıt alınamıyor.");
        }

        var existing = await unitOfWork.Repository<EventRegistration>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.EventId == request.EventId && x.CitizenUserId == request.CitizenUserId,
                cancellationToken)
            .ConfigureAwait(false);

        if (existing is { Status: EventRegistrationStatus.Registered })
        {
            return Result<EventRegistrationDto>.Failure("Bu etkinliğe zaten kayıtlısınız.");
        }

        var quota = EventQuota.TryParse(portalEvent.Body);
        if (quota is > 0)
        {
            var taken = await unitOfWork.Repository<EventRegistration>()
                .Query()
                .CountAsync(
                    x => x.EventId == request.EventId && x.Status == EventRegistrationStatus.Registered,
                    cancellationToken)
                .ConfigureAwait(false);

            if (taken >= quota)
            {
                return Result<EventRegistrationDto>.Failure("Kontenjan doldu. Başka bir etkinliği deneyin.");
            }
        }

        EventRegistration entity;
        if (existing is { Status: EventRegistrationStatus.Cancelled })
        {
            existing.Reactivate(now);
            unitOfWork.Repository<EventRegistration>().Update(existing);
            entity = existing;
        }
        else
        {
            entity = EventRegistration.Create(request.EventId, request.CitizenUserId, now);
            await unitOfWork.Repository<EventRegistration>()
                .AddAsync(entity, cancellationToken)
                .ConfigureAwait(false);
        }

        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        }
        catch (DbUpdateException)
        {
            return Result<EventRegistrationDto>.Failure("Bu etkinliğe zaten kayıtlısınız.");
        }

        return Result<EventRegistrationDto>.Success(EventRegistrationMapping.Map(entity, portalEvent));
    }
}

public sealed record CancelEventRegistrationCommand(Guid CitizenUserId, Guid EventId) : IRequest<Result>;

public sealed class CancelEventRegistrationCommandValidator : AbstractValidator<CancelEventRegistrationCommand>
{
    public CancelEventRegistrationCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.EventId).NotEmpty();
    }
}

public sealed class CancelEventRegistrationCommandHandler(IUnitOfWork unitOfWork, IDateTimeProvider clock)
    : IRequestHandler<CancelEventRegistrationCommand, Result>
{
    public async Task<Result> Handle(CancelEventRegistrationCommand request, CancellationToken cancellationToken)
    {
        var entity = await unitOfWork.Repository<EventRegistration>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.EventId == request.EventId && x.CitizenUserId == request.CitizenUserId,
                cancellationToken)
            .ConfigureAwait(false);

        if (entity is null)
        {
            return Result.Failure("Bu etkinliğe ait kaydınız bulunamadı.");
        }

        try
        {
            entity.Cancel(clock.UtcNow);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<EventRegistration>().Update(entity);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record ListMyEventRegistrationsQuery(Guid CitizenUserId)
    : IRequest<Result<IReadOnlyList<EventRegistrationDto>>>;

public sealed class ListMyEventRegistrationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListMyEventRegistrationsQuery, Result<IReadOnlyList<EventRegistrationDto>>>
{
    public async Task<Result<IReadOnlyList<EventRegistrationDto>>> Handle(
        ListMyEventRegistrationsQuery request,
        CancellationToken cancellationToken)
    {
        var rows = await unitOfWork.Repository<EventRegistration>()
            .Query()
            .Where(x => x.CitizenUserId == request.CitizenUserId)
            .OrderByDescending(x => x.RegisteredAtUtc)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        var eventIds = rows.Select(x => x.EventId).Distinct().ToList();
        var events = await unitOfWork.Repository<PortalContent>()
            .Query()
            .Where(x => eventIds.Contains(x.Id))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        var map = events.ToDictionary(x => x.Id);

        return Result<IReadOnlyList<EventRegistrationDto>>.Success(
            rows.Select(row => EventRegistrationMapping.Map(row, map.GetValueOrDefault(row.EventId))).ToList());
    }
}

public sealed record GetEventRegistrationStatusQuery(Guid EventId, Guid? UserId)
    : IRequest<Result<EventRegistrationStatusDto>>;

public sealed class GetEventRegistrationStatusQueryValidator : AbstractValidator<GetEventRegistrationStatusQuery>
{
    public GetEventRegistrationStatusQueryValidator()
    {
        RuleFor(x => x.EventId).NotEmpty();
    }
}

public sealed class GetEventRegistrationStatusQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetEventRegistrationStatusQuery, Result<EventRegistrationStatusDto>>
{
    public async Task<Result<EventRegistrationStatusDto>> Handle(
        GetEventRegistrationStatusQuery request,
        CancellationToken cancellationToken)
    {
        var portalEvent = await unitOfWork.Repository<PortalContent>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.Id == request.EventId && x.Kind == PortalContentKind.Event && x.IsPublished,
                cancellationToken)
            .ConfigureAwait(false);

        if (portalEvent is null)
        {
            return Result<EventRegistrationStatusDto>.Failure("Etkinlik bulunamadı.");
        }

        var registeredCount = await unitOfWork.Repository<EventRegistration>()
            .Query()
            .CountAsync(
                x => x.EventId == request.EventId && x.Status == EventRegistrationStatus.Registered,
                cancellationToken)
            .ConfigureAwait(false);

        var quota = EventQuota.TryParse(portalEvent.Body);
        var remaining = quota is > 0 ? Math.Max(0, quota.Value - registeredCount) : (int?)null;

        EventRegistration? mine = null;
        if (request.UserId is { } userId)
        {
            mine = await unitOfWork.Repository<EventRegistration>()
                .Query()
                .FirstOrDefaultAsync(
                    x => x.EventId == request.EventId && x.CitizenUserId == userId,
                    cancellationToken)
                .ConfigureAwait(false);
        }

        var isRegistered = mine is { Status: EventRegistrationStatus.Registered };
        return Result<EventRegistrationStatusDto>.Success(new EventRegistrationStatusDto(
            portalEvent.Id,
            isRegistered,
            isRegistered ? mine!.Id : mine?.Id,
            mine?.Status.ToString(),
            registeredCount,
            quota,
            remaining));
    }
}

internal static class EventRegistrationMapping
{
    public static EventRegistrationDto Map(EventRegistration row, PortalContent? portalEvent) => new(
        row.Id,
        row.EventId,
        portalEvent?.Title ?? "Etkinlik",
        portalEvent?.Location,
        portalEvent?.Category,
        portalEvent?.StartsAtUtc,
        portalEvent?.EndsAtUtc,
        row.Status.ToString(),
        row.RegisteredAtUtc,
        row.CancelledAtUtc);
}
