using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Dtos;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Queries;

/// <summary>
/// Şu anda vatandaşlara görünür olan (yayınlanmış ve süresi geçmemiş) duyuruları sayfalı olarak
/// listeler. Herkese açık (anonim) erişilebilir.
/// </summary>
public sealed record GetPublishedAnnouncementsQuery(int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<AnnouncementDto>>>;

public sealed class GetPublishedAnnouncementsQueryValidator : AbstractValidator<GetPublishedAnnouncementsQuery>
{
    public GetPublishedAnnouncementsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetPublishedAnnouncementsQueryHandler(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
    : IRequestHandler<GetPublishedAnnouncementsQuery, Result<PaginatedList<AnnouncementDto>>>
{
    public async Task<Result<PaginatedList<AnnouncementDto>>> Handle(
        GetPublishedAnnouncementsQuery request,
        CancellationToken cancellationToken)
    {
        var now = dateTimeProvider.UtcNow;

        var query = unitOfWork.Repository<Announcement>()
            .Query()
            .Where(a => a.Status == AnnouncementStatus.Published && (a.PublishEndUtc == null || a.PublishEndUtc >= now))
            .OrderByDescending(a => a.PublishStartUtc)
            .Select(a => new AnnouncementDto(a.Id, a.Title, a.Content, a.Status, a.PublishStartUtc, a.PublishEndUtc, a.CreatedAtUtc));

        var page = await PaginatedList<AnnouncementDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<AnnouncementDto>>.Success(page);
    }
}
