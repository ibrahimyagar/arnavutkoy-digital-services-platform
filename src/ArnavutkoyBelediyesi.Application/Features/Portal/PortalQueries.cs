using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Portal;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Features.Portal;

public sealed record ListPortalContentQuery(string Kind, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<PortalContentDto>>>;

public sealed class ListPortalContentQueryValidator : AbstractValidator<ListPortalContentQuery>
{
    public ListPortalContentQueryValidator()
    {
        RuleFor(x => x.Kind).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class ListPortalContentQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<ListPortalContentQuery, Result<PaginatedList<PortalContentDto>>>
{
    public async Task<Result<PaginatedList<PortalContentDto>>> Handle(
        ListPortalContentQuery request,
        CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<PortalContentKind>(request.Kind, ignoreCase: true, out var kind))
        {
            return Result<PaginatedList<PortalContentDto>>.Failure("Geçersiz içerik türü.");
        }

        var projected = unitOfWork.Repository<PortalContent>()
            .Query()
            .Where(x => x.Kind == kind && x.IsPublished)
            .OrderBy(x => x.SortOrder)
            .ThenByDescending(x => x.StartsAtUtc ?? x.CreatedAtUtc)
            .Select(x => new PortalContentDto(
                x.Id,
                x.Kind.ToString(),
                x.Title,
                x.Summary,
                x.Body,
                x.Slug,
                x.Location,
                x.Category,
                x.StartsAtUtc,
                x.EndsAtUtc,
                x.SortOrder,
                x.CreatedAtUtc));

        var page = await PaginatedList<PortalContentDto>
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<PortalContentDto>>.Success(page);
    }
}

public sealed record GetPortalContentBySlugQuery(string Slug)
    : IRequest<Result<PortalContentDto>>;

public sealed class GetPortalContentBySlugQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetPortalContentBySlugQuery, Result<PortalContentDto>>
{
    public async Task<Result<PortalContentDto>> Handle(
        GetPortalContentBySlugQuery request,
        CancellationToken cancellationToken)
    {
        var item = await unitOfWork.Repository<PortalContent>()
            .Query()
            .FirstOrDefaultAsync(
                x => x.Slug == request.Slug.Trim().ToLowerInvariant() && x.IsPublished,
                cancellationToken)
            .ConfigureAwait(false);

        return item is null
            ? Result<PortalContentDto>.Failure("İçerik bulunamadı.")
            : Result<PortalContentDto>.Success(PortalContentMapping.ToDto(item));
    }
}

public sealed record GetPortalContentByIdQuery(Guid Id)
    : IRequest<Result<PortalContentDto>>;

public sealed class GetPortalContentByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetPortalContentByIdQuery, Result<PortalContentDto>>
{
    public async Task<Result<PortalContentDto>> Handle(
        GetPortalContentByIdQuery request,
        CancellationToken cancellationToken)
    {
        var item = await unitOfWork.Repository<PortalContent>()
            .Query()
            .FirstOrDefaultAsync(x => x.Id == request.Id && x.IsPublished, cancellationToken)
            .ConfigureAwait(false);

        return item is null
            ? Result<PortalContentDto>.Failure("İçerik bulunamadı.")
            : Result<PortalContentDto>.Success(PortalContentMapping.ToDto(item));
    }
}
