using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Announcements;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.Announcements.Commands;

/// <summary>
/// Yeni bir taslak duyuru oluşturur. Officer/Administrator rolü gerektirir (API katmanında yetkilendirilir).
/// </summary>
public sealed record CreateAnnouncementCommand(string Title, string Content, DateTime? PublishEndUtc)
    : IRequest<Result<Guid>>;

public sealed class CreateAnnouncementCommandValidator : AbstractValidator<CreateAnnouncementCommand>
{
    public CreateAnnouncementCommandValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Content).NotEmpty().MaximumLength(4000);
        RuleFor(x => x.PublishEndUtc)
            .Must(date => !date.HasValue || date.Value > DateTime.UtcNow)
            .WithMessage("Geçerlilik bitiş tarihi geçmişte olamaz.");
    }
}

public sealed class CreateAnnouncementCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<CreateAnnouncementCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateAnnouncementCommand request, CancellationToken cancellationToken)
    {
        var announcement = Announcement.CreateDraft(request.Title, request.Content, request.PublishEndUtc);

        await unitOfWork.Repository<Announcement>().AddAsync(announcement, cancellationToken).ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result<Guid>.Success(announcement.Id);
    }
}
