using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;

/// <summary>
/// Yayındaki bir duyuruyu arşivler; artık vatandaşlara gösterilmez. Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record ArchiveAnnouncementCommand(Guid AnnouncementId) : IRequest<Result>;

public sealed class ArchiveAnnouncementCommandValidator : AbstractValidator<ArchiveAnnouncementCommand>
{
    public ArchiveAnnouncementCommandValidator()
    {
        RuleFor(x => x.AnnouncementId).NotEmpty();
    }
}

public sealed class ArchiveAnnouncementCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ArchiveAnnouncementCommand, Result>
{
    public async Task<Result> Handle(ArchiveAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Announcement>();
        var announcement = await repository.GetByIdAsync(request.AnnouncementId, cancellationToken).ConfigureAwait(false);

        if (announcement is null)
        {
            return Result.Failure($"'{request.AnnouncementId}' kimlikli duyuru bulunamadı.");
        }

        announcement.Archive();
        repository.Update(announcement);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
