using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Dtos;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Queries;

public sealed record GetMySocialAssistanceApplicationsQuery(Guid ApplicantUserId, int PageNumber = 1, int PageSize = 20)
    : IRequest<Result<PaginatedList<SocialAssistanceApplicationDto>>>;

public sealed class GetMySocialAssistanceApplicationsQueryValidator : AbstractValidator<GetMySocialAssistanceApplicationsQuery>
{
    public GetMySocialAssistanceApplicationsQueryValidator()
    {
        RuleFor(x => x.ApplicantUserId).NotEmpty();
        RuleFor(x => x.PageNumber).GreaterThan(0);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100);
    }
}

public sealed class GetMySocialAssistanceApplicationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetMySocialAssistanceApplicationsQuery, Result<PaginatedList<SocialAssistanceApplicationDto>>>
{
    public async Task<Result<PaginatedList<SocialAssistanceApplicationDto>>> Handle(
        GetMySocialAssistanceApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<SocialAssistanceApplication>().Query()
            .Where(a => a.ApplicantUserId == request.ApplicantUserId)
            .OrderByDescending(a => a.SubmittedAtUtc)
            .Select(a => new SocialAssistanceApplicationDto(
                a.Id, a.ApplicantUserId, a.Type, a.HouseholdSize, a.MonthlyIncome, a.HouseholdSummary,
                a.ExtraFieldsJson, a.Status, a.SubmittedAtUtc, a.ReviewedAtUtc, a.ReviewedByUserId, a.ReviewNote));

        var page = await PaginatedList<SocialAssistanceApplicationDto>
            .CreateAsync(query, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<SocialAssistanceApplicationDto>>.Success(page);
    }
}

public sealed record GetAllSocialAssistanceApplicationsQuery(
    SocialAssistanceApplicationStatus? Status,
    int PageNumber = 1,
    int PageSize = 20) : IRequest<Result<PaginatedList<SocialAssistanceApplicationDto>>>;

public sealed class GetAllSocialAssistanceApplicationsQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetAllSocialAssistanceApplicationsQuery, Result<PaginatedList<SocialAssistanceApplicationDto>>>
{
    public async Task<Result<PaginatedList<SocialAssistanceApplicationDto>>> Handle(
        GetAllSocialAssistanceApplicationsQuery request,
        CancellationToken cancellationToken)
    {
        var query = unitOfWork.Repository<SocialAssistanceApplication>().Query();
        if (request.Status.HasValue)
        {
            query = query.Where(a => a.Status == request.Status.Value);
        }

        var projected = query
            .OrderByDescending(a => a.SubmittedAtUtc)
            .Select(a => new SocialAssistanceApplicationDto(
                a.Id, a.ApplicantUserId, a.Type, a.HouseholdSize, a.MonthlyIncome, a.HouseholdSummary,
                a.ExtraFieldsJson, a.Status, a.SubmittedAtUtc, a.ReviewedAtUtc, a.ReviewedByUserId, a.ReviewNote));

        var page = await PaginatedList<SocialAssistanceApplicationDto>
            .CreateAsync(projected, request.PageNumber, request.PageSize, cancellationToken)
            .ConfigureAwait(false);

        return Result<PaginatedList<SocialAssistanceApplicationDto>>.Success(page);
    }
}

public sealed record GetSocialAssistanceApplicationByIdQuery(Guid ApplicationId)
    : IRequest<Result<SocialAssistanceApplicationDto>>;

public sealed class GetSocialAssistanceApplicationByIdQueryHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<GetSocialAssistanceApplicationByIdQuery, Result<SocialAssistanceApplicationDto>>
{
    public async Task<Result<SocialAssistanceApplicationDto>> Handle(
        GetSocialAssistanceApplicationByIdQuery request,
        CancellationToken cancellationToken)
    {
        var a = await unitOfWork.Repository<SocialAssistanceApplication>()
            .GetByIdAsync(request.ApplicationId, cancellationToken)
            .ConfigureAwait(false);

        if (a is null)
        {
            return Result<SocialAssistanceApplicationDto>.Failure("Başvuru bulunamadı.");
        }

        return Result<SocialAssistanceApplicationDto>.Success(new SocialAssistanceApplicationDto(
            a.Id, a.ApplicantUserId, a.Type, a.HouseholdSize, a.MonthlyIncome, a.HouseholdSummary,
            a.ExtraFieldsJson, a.Status, a.SubmittedAtUtc, a.ReviewedAtUtc, a.ReviewedByUserId, a.ReviewNote));
    }
}
