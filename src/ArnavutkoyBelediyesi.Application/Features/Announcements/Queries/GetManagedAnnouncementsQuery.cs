using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Dtos;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Queries;

/// <summary>
/// Tüm duyuruları (taslak/yayında/arşiv), isteğe bağlı durum filtresiyle sayfalı listeler.
/// Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record GetManagedAnnouncementsQuery(
    AnnouncementStatus? Status,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<AnnouncementDto>>>;

public sealed class GetManagedAnnouncementsQueryValidator : AbstractValidator<GetManagedAnnouncementsQuery>
{
    public GetManagedAnnouncementsQueryValidator()
    {
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetManagedAnnouncementsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetManagedAnnouncementsQuery, Result<PaginatedList<AnnouncementDto>>>
{
    public async Task<Result<PaginatedList<AnnouncementDto>>> Handle(
        GetManagedAnnouncementsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<Announcement>().Query();

        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        var projected = query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new AnnouncementDto(
                a.Id,
                a.Title,
                a.Content,
                a.Status,
                a.PublishStartUtc,
                a.PublishEndUtc,
                a.CreatedAtUtc));

        var page = await PaginatedList<AnnouncementDto>
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<AnnouncementDto>>.Success(page);
    }
}
