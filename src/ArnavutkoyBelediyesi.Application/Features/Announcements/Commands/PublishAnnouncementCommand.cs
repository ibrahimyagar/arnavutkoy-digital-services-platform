using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;

/// <summary>
/// Taslak durumundaki bir duyuruyu yayına alır. Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record PublishAnnouncementCommand(Guid AnnouncementId) : IRequest<Result>;

public sealed class PublishAnnouncementCommandValidator : AbstractValidator<PublishAnnouncementCommand>
{
    public PublishAnnouncementCommandValidator()
    {
        RuleFor(x => x.AnnouncementId).NotEmpty();
    }
}

public sealed class PublishAnnouncementCommandHandler(IUnitOfWork unitOfWork, IDateTimeProvider dateTimeProvider)
    : IRequestHandler<PublishAnnouncementCommand, Result>
{
    public async Task<Result> Handle(PublishAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Announcement>();
        var announcement = await repository.GetByIdAsync(request.AnnouncementId, cancellationToken).ConfigureAwait(false);

        if (announcement is null)
        {
            return Result.Failure($"'{request.AnnouncementId}' kimlikli duyuru bulunamadı.");
        }

        try
        {
            announcement.Publish(dateTimeProvider.UtcNow);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure(ex.Message);
        }

        repository.Update(announcement);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
