using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.EServices;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.EServices;

public sealed record SportsFacilityDto(Guid Id, string Name, string Address, string ActivityType, int CapacityPerSlot);
public sealed record SportsAppointmentDto(Guid Id, Guid FacilityId, string FacilityName, DateTime SlotStartUtc, DateTime SlotEndUtc, string TrackingCode, string Status);
public sealed record MarriageSlotDto(Guid Id, string HallName, DateTime CeremonyAtUtc, int Capacity, int Remaining, bool IsOpen);
public sealed record MarriageBookingDto(Guid Id, Guid SlotId, string HallName, DateTime CeremonyAtUtc, string PartnerFullName, string TrackingCode, string Status);
public sealed record DocumentApplicationDto(Guid Id, string Type, string Title, string Description, string TrackingCode, string Status, string? StaffNote, DateTime CreatedAtUtc);
public sealed record ZoningParcelDto(Guid Id, string Ada, string Parsel, string NeighborhoodName, string ZoningStatus, string LandUse, decimal AreaSqm, decimal FeePerSqm);
public sealed record ZoningFeeQuoteDto(string Ada, string Parsel, string NeighborhoodName, string ZoningStatus, string LandUse, decimal AreaSqm, decimal FeePerSqm, decimal RequestedAreaSqm, decimal TotalFee);
public sealed record TrackingLookupDto(string Kind, string TrackingCode, string Status, string Title, DateTime? WhenUtc, string? Detail);

public static class TrackingCodeFactory
{
    public static string Next(string prefix) =>
        $"{prefix}-{DateTime.UtcNow:yyMMdd}-{Random.Shared.Next(1000, 9999)}";
}

public sealed record ListSportsFacilitiesQuery : IRequest<Result<IReadOnlyList<SportsFacilityDto>>>;

public sealed class ListSportsFacilitiesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListSportsFacilitiesQuery, Result<IReadOnlyList<SportsFacilityDto>>>
{
    public async Task<Result<IReadOnlyList<SportsFacilityDto>>> Handle(ListSportsFacilitiesQuery request, CancellationToken cancellationToken)
    {
        var items = await unitOfWork.Repository<SportsFacility>()
            .Query()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Name)
            .Select(x => new SportsFacilityDto(x.Id, x.Name, x.Address, x.ActivityType, x.CapacityPerSlot))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        return Result<IReadOnlyList<SportsFacilityDto>>.Success(items);
    }
}

public sealed record BookSportsAppointmentCommand(Guid CitizenUserId, Guid FacilityId, DateTime SlotStartUtc)
    : IRequest<Result<SportsAppointmentDto>>;

public sealed class BookSportsAppointmentCommandValidator : AbstractValidator<BookSportsAppointmentCommand>
{
    public BookSportsAppointmentCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.FacilityId).NotEmpty();
        RuleFor(x => x.SlotStartUtc).Must(d => d > DateTime.UtcNow.AddMinutes(-5)).WithMessage("Randevu saati gelecekte olmalıdır.");
    }
}

public sealed class BookSportsAppointmentCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<BookSportsAppointmentCommand, Result<SportsAppointmentDto>>
{
    public async Task<Result<SportsAppointmentDto>> Handle(BookSportsAppointmentCommand request, CancellationToken cancellationToken)
    {
        var facility = await unitOfWork.Repository<SportsFacility>()
            .Query()
            .FirstOrDefaultAsync(x => x.Id == request.FacilityId && x.IsActive, cancellationToken)
            .ConfigureAwait(false);
        if (facility is null)
        {
            return Result<SportsAppointmentDto>.Failure("Spor tesisi bulunamadı.");
        }

        var slotStart = DateTime.SpecifyKind(request.SlotStartUtc, DateTimeKind.Utc);
        var slotEnd = slotStart.AddHours(1);
        var booked = await unitOfWork.Repository<SportsAppointment>()
            .Query()
            .CountAsync(
                x => x.FacilityId == facility.Id
                     && x.Status == SportsAppointmentStatus.Booked
                     && x.SlotStartUtc == slotStart,
                cancellationToken)
            .ConfigureAwait(false);
        if (booked >= facility.CapacityPerSlot)
        {
            return Result<SportsAppointmentDto>.Failure("Bu saat dolu. Başka bir slot seçin.");
        }

        var entity = SportsAppointment.Book(facility.Id, request.CitizenUserId, slotStart, slotEnd, TrackingCodeFactory.Next("SP"));
        await unitOfWork.Repository<SportsAppointment>().AddAsync(entity, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<SportsAppointmentDto>.Success(new SportsAppointmentDto(
            entity.Id, facility.Id, facility.Name, entity.SlotStartUtc, entity.SlotEndUtc, entity.TrackingCode, entity.Status.ToString()));
    }
}

public sealed record ListMySportsAppointmentsQuery(Guid CitizenUserId)
    : IRequest<Result<IReadOnlyList<SportsAppointmentDto>>>;

public sealed class ListMySportsAppointmentsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListMySportsAppointmentsQuery, Result<IReadOnlyList<SportsAppointmentDto>>>
{
    public async Task<Result<IReadOnlyList<SportsAppointmentDto>>> Handle(ListMySportsAppointmentsQuery request, CancellationToken cancellationToken)
    {
        var facilities = await unitOfWork.Repository<SportsFacility>().Query().ToListAsync(cancellationToken).ConfigureAwait(false);
        var map = facilities.ToDictionary(x => x.Id, x => x.Name);
        var items = await unitOfWork.Repository<SportsAppointment>()
            .Query()
            .Where(x => x.CitizenUserId == request.CitizenUserId)
            .OrderByDescending(x => x.SlotStartUtc)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return Result<IReadOnlyList<SportsAppointmentDto>>.Success(
            items.Select(x => new SportsAppointmentDto(
                x.Id,
                x.FacilityId,
                map.GetValueOrDefault(x.FacilityId, "Tesis"),
                x.SlotStartUtc,
                x.SlotEndUtc,
                x.TrackingCode,
                x.Status.ToString())).ToList());
    }
}

public sealed record ListMarriageSlotsQuery : IRequest<Result<IReadOnlyList<MarriageSlotDto>>>;

public sealed class ListMarriageSlotsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListMarriageSlotsQuery, Result<IReadOnlyList<MarriageSlotDto>>>
{
    public async Task<Result<IReadOnlyList<MarriageSlotDto>>> Handle(ListMarriageSlotsQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var items = await unitOfWork.Repository<MarriageSlot>()
            .Query()
            .Where(x => x.CeremonyAtUtc >= now)
            .OrderBy(x => x.CeremonyAtUtc)
            .Select(x => new MarriageSlotDto(x.Id, x.HallName, x.CeremonyAtUtc, x.Capacity, x.Capacity - x.BookedCount, x.IsOpen))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        return Result<IReadOnlyList<MarriageSlotDto>>.Success(items);
    }
}

public sealed record BookMarriageCommand(Guid CitizenUserId, Guid SlotId, string PartnerFullName)
    : IRequest<Result<MarriageBookingDto>>;

public sealed class BookMarriageCommandValidator : AbstractValidator<BookMarriageCommand>
{
    public BookMarriageCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.SlotId).NotEmpty();
        RuleFor(x => x.PartnerFullName).NotEmpty().MaximumLength(160);
    }
}

public sealed class BookMarriageCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<BookMarriageCommand, Result<MarriageBookingDto>>
{
    public async Task<Result<MarriageBookingDto>> Handle(BookMarriageCommand request, CancellationToken cancellationToken)
    {
        var slot = await unitOfWork.Repository<MarriageSlot>()
            .Query()
            .FirstOrDefaultAsync(x => x.Id == request.SlotId, cancellationToken)
            .ConfigureAwait(false);
        if (slot is null)
        {
            return Result<MarriageBookingDto>.Failure("Nikah saati bulunamadı.");
        }

        try
        {
            slot.ReserveOne();
        }
        catch (InvalidOperationException ex)
        {
            return Result<MarriageBookingDto>.Failure(ex.Message);
        }

        unitOfWork.Repository<MarriageSlot>().Update(slot);

        var booking = MarriageBooking.Create(slot.Id, request.CitizenUserId, request.PartnerFullName, TrackingCodeFactory.Next("NK"));
        await unitOfWork.Repository<MarriageBooking>().AddAsync(booking, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<MarriageBookingDto>.Success(new MarriageBookingDto(
            booking.Id, slot.Id, slot.HallName, slot.CeremonyAtUtc, booking.PartnerFullName, booking.TrackingCode, booking.Status.ToString()));
    }
}

public sealed record SubmitDocumentApplicationCommand(
    Guid CitizenUserId,
    DocumentApplicationType Type,
    string Title,
    string Description) : IRequest<Result<DocumentApplicationDto>>;

public sealed class SubmitDocumentApplicationCommandValidator : AbstractValidator<SubmitDocumentApplicationCommand>
{
    public SubmitDocumentApplicationCommandValidator()
    {
        RuleFor(x => x.CitizenUserId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
    }
}

public sealed class SubmitDocumentApplicationCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<SubmitDocumentApplicationCommand, Result<DocumentApplicationDto>>
{
    public async Task<Result<DocumentApplicationDto>> Handle(SubmitDocumentApplicationCommand request, CancellationToken cancellationToken)
    {
        var entity = DocumentApplication.Submit(
            request.CitizenUserId,
            request.Type,
            request.Title,
            request.Description,
            TrackingCodeFactory.Next("BV"));
        await unitOfWork.Repository<DocumentApplication>().AddAsync(entity, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<DocumentApplicationDto>.Success(new DocumentApplicationDto(
            entity.Id, entity.Type.ToString(), entity.Title, entity.Description, entity.TrackingCode, entity.Status.ToString(), entity.StaffNote, entity.CreatedAtUtc));
    }
}

public sealed record ListMyDocumentApplicationsQuery(Guid CitizenUserId)
    : IRequest<Result<IReadOnlyList<DocumentApplicationDto>>>;

public sealed class ListMyDocumentApplicationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListMyDocumentApplicationsQuery, Result<IReadOnlyList<DocumentApplicationDto>>>
{
    public async Task<Result<IReadOnlyList<DocumentApplicationDto>>> Handle(ListMyDocumentApplicationsQuery request, CancellationToken cancellationToken)
    {
        var items = await unitOfWork.Repository<DocumentApplication>()
            .Query()
            .Where(x => x.CitizenUserId == request.CitizenUserId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new DocumentApplicationDto(x.Id, x.Type.ToString(), x.Title, x.Description, x.TrackingCode, x.Status.ToString(), x.StaffNote, x.CreatedAtUtc))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        return Result<IReadOnlyList<DocumentApplicationDto>>.Success(items);
    }
}

public sealed record LookupTrackingQuery(string TrackingCode) : IRequest<Result<TrackingLookupDto>>;

public sealed class LookupTrackingQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<LookupTrackingQuery, Result<TrackingLookupDto>>
{
    public async Task<Result<TrackingLookupDto>> Handle(LookupTrackingQuery request, CancellationToken cancellationToken)
    {
        var code = request.TrackingCode.Trim().ToUpperInvariant();

        var doc = await unitOfWork.Repository<DocumentApplication>()
            .Query().FirstOrDefaultAsync(x => x.TrackingCode == code, cancellationToken).ConfigureAwait(false);
        if (doc is not null)
        {
            return Result<TrackingLookupDto>.Success(new TrackingLookupDto("Document", doc.TrackingCode, doc.Status.ToString(), doc.Title, doc.CreatedAtUtc, doc.StaffNote));
        }

        var sport = await unitOfWork.Repository<SportsAppointment>()
            .Query().FirstOrDefaultAsync(x => x.TrackingCode == code, cancellationToken).ConfigureAwait(false);
        if (sport is not null)
        {
            return Result<TrackingLookupDto>.Success(new TrackingLookupDto("Sports", sport.TrackingCode, sport.Status.ToString(), "Spor randevusu", sport.SlotStartUtc, null));
        }

        var marriage = await unitOfWork.Repository<MarriageBooking>()
            .Query().FirstOrDefaultAsync(x => x.TrackingCode == code, cancellationToken).ConfigureAwait(false);
        if (marriage is not null)
        {
            return Result<TrackingLookupDto>.Success(new TrackingLookupDto("Marriage", marriage.TrackingCode, marriage.Status.ToString(), marriage.PartnerFullName, null, null));
        }

        var contact = await unitOfWork.Repository<ContactMessage>()
            .Query().FirstOrDefaultAsync(x => x.TrackingCode == code, cancellationToken).ConfigureAwait(false);
        if (contact is not null)
        {
            return Result<TrackingLookupDto>.Success(new TrackingLookupDto(
                "Contact",
                contact.TrackingCode,
                contact.Status.ToString(),
                contact.Subject,
                contact.CreatedAtUtc,
                contact.PreferredReply == "Phone" ? "Geri dönüş: telefon" : "Geri dönüş: e-posta"));
        }

        return Result<TrackingLookupDto>.Failure("Takip kodu bulunamadı.");
    }
}

public sealed record ContactReceiptDto(Guid Id, string TrackingCode, string Subject, string Status, DateTime CreatedAtUtc);

public sealed record ContactMessageSummaryDto(
    Guid Id,
    string TrackingCode,
    string Subject,
    string Status,
    string PreferredReply,
    DateTime CreatedAtUtc);

public sealed record SubmitContactMessageCommand(
    string FullName,
    string Email,
    string Subject,
    string Body,
    string? Phone,
    string PreferredReply,
    Guid? CitizenUserId) : IRequest<Result<ContactReceiptDto>>;

public sealed class SubmitContactMessageCommandValidator : AbstractValidator<SubmitContactMessageCommand>
{
    public SubmitContactMessageCommandValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(160);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(200)
            .WithMessage("E-posta adresinizi kontrol edin.");
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Body).NotEmpty().MinimumLength(20).MaximumLength(4000)
            .WithMessage("Mesaj en az 20 karakter olmalıdır.");
        RuleFor(x => x.PreferredReply).Must(v => v is "Email" or "Phone")
            .WithMessage("Geri dönüş yöntemi seçin.");
        RuleFor(x => x.Phone)
            .NotEmpty()
            .When(x => x.PreferredReply == "Phone")
            .WithMessage("Telefon numarası geçerli değil.");
        RuleFor(x => x.Phone)
            .Must(BeValidPhone)
            .When(x => !string.IsNullOrWhiteSpace(x.Phone))
            .WithMessage("Telefon numarası geçerli değil.");
    }

    private static bool BeValidPhone(string? phone)
    {
        if (string.IsNullOrWhiteSpace(phone)) return true;
        var digits = phone.Where(char.IsDigit).Count();
        return digits is >= 10 and <= 13;
    }
}

public sealed class SubmitContactMessageCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<SubmitContactMessageCommand, Result<ContactReceiptDto>>
{
    public async Task<Result<ContactReceiptDto>> Handle(SubmitContactMessageCommand request, CancellationToken cancellationToken)
    {
        string code;
        var guard = 0;
        do
        {
            code = TrackingCodeFactory.Next("ILET");
            guard++;
        }
        while (guard < 8 &&
               await unitOfWork.Repository<ContactMessage>().Query()
                   .AnyAsync(x => x.TrackingCode == code, cancellationToken)
                   .ConfigureAwait(false));

        if (guard >= 8)
        {
            code = $"ILET-{DateTime.UtcNow:yyMMdd}-{Guid.NewGuid().ToString("N")[..4]}".ToUpperInvariant();
        }

        ContactMessage entity;
        try
        {
            entity = ContactMessage.Create(
                request.FullName,
                request.Email,
                request.Subject,
                request.Body,
                code,
                request.PreferredReply,
                request.Phone,
                request.CitizenUserId);
        }
        catch (ArgumentException ex)
        {
            return Result<ContactReceiptDto>.Failure(ex.Message);
        }

        await unitOfWork.Repository<ContactMessage>().AddAsync(entity, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<ContactReceiptDto>.Success(
            new ContactReceiptDto(entity.Id, entity.TrackingCode, entity.Subject, entity.Status.ToString(), entity.CreatedAtUtc));
    }
}

public sealed record ListMyContactMessagesQuery(Guid CitizenUserId)
    : IRequest<Result<IReadOnlyList<ContactMessageSummaryDto>>>;

public sealed class ListMyContactMessagesQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListMyContactMessagesQuery, Result<IReadOnlyList<ContactMessageSummaryDto>>>
{
    public async Task<Result<IReadOnlyList<ContactMessageSummaryDto>>> Handle(
        ListMyContactMessagesQuery request,
        CancellationToken cancellationToken)
    {
        var items = await unitOfWork.Repository<ContactMessage>()
            .Query()
            .Where(x => x.CitizenUserId == request.CitizenUserId)
            .OrderByDescending(x => x.CreatedAtUtc)
            .Select(x => new ContactMessageSummaryDto(
                x.Id, x.TrackingCode, x.Subject, x.Status.ToString(), x.PreferredReply, x.CreatedAtUtc))
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);
        return Result<IReadOnlyList<ContactMessageSummaryDto>>.Success(items);
    }
}

public sealed record LookupZoningQuery(string Ada, string Parsel) : IRequest<Result<ZoningParcelDto>>;

public sealed class LookupZoningQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<LookupZoningQuery, Result<ZoningParcelDto>>
{
    public async Task<Result<ZoningParcelDto>> Handle(LookupZoningQuery request, CancellationToken cancellationToken)
    {
        var parcel = await unitOfWork.Repository<ZoningParcel>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.Ada == request.Ada.Trim() && x.Parsel == request.Parsel.Trim(),
                cancellationToken)
            .ConfigureAwait(false);
        return parcel is null
            ? Result<ZoningParcelDto>.Failure("Ada/parsel bulunamadı (demo veri seti).")
            : Result<ZoningParcelDto>.Success(new ZoningParcelDto(
                parcel.Id, parcel.Ada, parcel.Parsel, parcel.NeighborhoodName, parcel.ZoningStatus, parcel.LandUse, parcel.AreaSqm, parcel.FeePerSqm));
    }
}

public sealed record CalculateZoningFeeQuery(string Ada, string Parsel, decimal RequestedAreaSqm)
    : IRequest<Result<ZoningFeeQuoteDto>>;

public sealed class CalculateZoningFeeQueryValidator : AbstractValidator<CalculateZoningFeeQuery>
{
    public CalculateZoningFeeQueryValidator()
    {
        RuleFor(x => x.Ada).NotEmpty();
        RuleFor(x => x.Parsel).NotEmpty();
        RuleFor(x => x.RequestedAreaSqm).GreaterThan(0);
    }
}

public sealed class CalculateZoningFeeQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CalculateZoningFeeQuery, Result<ZoningFeeQuoteDto>>
{
    public async Task<Result<ZoningFeeQuoteDto>> Handle(CalculateZoningFeeQuery request, CancellationToken cancellationToken)
    {
        var parcel = await unitOfWork.Repository<ZoningParcel>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.Ada == request.Ada.Trim() && x.Parsel == request.Parsel.Trim(),
                cancellationToken)
            .ConfigureAwait(false);
        if (parcel is null)
        {
            return Result<ZoningFeeQuoteDto>.Failure("Ada/parsel bulunamadı (demo veri seti).");
        }

        var fee = parcel.CalculateFee(request.RequestedAreaSqm);
        return Result<ZoningFeeQuoteDto>.Success(new ZoningFeeQuoteDto(
            parcel.Ada, parcel.Parsel, parcel.NeighborhoodName, parcel.ZoningStatus, parcel.LandUse,
            parcel.AreaSqm, parcel.FeePerSqm, request.RequestedAreaSqm, fee));
    }
}
