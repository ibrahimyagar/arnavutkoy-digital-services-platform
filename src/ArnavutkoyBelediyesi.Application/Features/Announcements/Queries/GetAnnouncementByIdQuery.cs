using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.Announcements.Dtos;
using ArnavutkoyBelediyesi.Domain.Announcements;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Queries;

/// <summary>
/// Kimliğine göre bir duyurunun tam detayını getirir. <paramref name="IncludeUnpublished"/> API
/// katmanında yalnızca Officer/Administrator rolü için <c>true</c> olarak gönderilir; anonim veya
/// Vatandaş rolündeki istekler için taslak/arşivlenmiş duyurular "bulunamadı" olarak döner
/// (bilgi ifşasını önlemek için).
/// </summary>
public sealed record GetAnnouncementByIdQuery(Guid AnnouncementId, bool IncludeUnpublished) : IRequest<Result<AnnouncementDto>>;

public sealed class GetAnnouncementByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAnnouncementByIdQuery, Result<AnnouncementDto>>
{
    public async Task<Result<AnnouncementDto>> Handle(GetAnnouncementByIdQuery request, CancellationToken cancellationToken)
    {
        var announcement = await unitOfWork.Repository<Announcement>()
            .GetByIdAsync(request.AnnouncementId, cancellationToken)
            .ConfigureAwait(false);

        if (announcement is null)
        {
            return Result<AnnouncementDto>.Failure($"'{request.AnnouncementId}' kimlikli duyuru bulunamadı.");
        }

        if (!request.IncludeUnpublished && announcement.Status != AnnouncementStatus.Published)
        {
            return Result<AnnouncementDto>.Failure($"'{request.AnnouncementId}' kimlikli duyuru bulunamadı.");
        }

        var dto = new AnnouncementDto(
            announcement.Id,
            announcement.Title,
            announcement.Content,
            announcement.Status,
            announcement.PublishStartUtc,
            announcement.PublishEndUtc,
            announcement.CreatedAtUtc);

        return Result<AnnouncementDto>.Success(dto);
    }
}
