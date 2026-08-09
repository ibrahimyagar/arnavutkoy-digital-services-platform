using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;

/// <summary>
/// Taslak durumundaki bir duyurunun başlık/içeriğini günceller. Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record UpdateAnnouncementCommand(Guid AnnouncementId, string Title, string Content) : IRequest<Result>;

public sealed class UpdateAnnouncementCommandValidator : AbstractValidator<UpdateAnnouncementCommand>
{
    public UpdateAnnouncementCommandValidator()
    {
        RuleFor(x => x.AnnouncementId).NotEmpty();
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
    }
}

public sealed class UpdateAnnouncementCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateAnnouncementCommand, Result>
{
    public async Task<Result> Handle(UpdateAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<Announcement>();
        var announcement = await repository.GetByIdAsync(request.AnnouncementId, cancellationToken).ConfigureAwait(false);

        if (announcement is null)
        {
            return Result.Failure($"'{request.AnnouncementId}' kimlikli duyuru bulunamadı.");
        }

        try
        {
            announcement.UpdateContent(request.Title, request.Content);
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
