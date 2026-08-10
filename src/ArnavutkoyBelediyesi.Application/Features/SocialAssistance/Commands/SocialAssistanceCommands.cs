using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using ArnavutkoyBelediyesi.Domain.SocialAssistance;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.SocialAssistance.Commands;

public sealed record SubmitSocialAssistanceApplicationCommand(
    Guid ApplicantUserId,
    AssistanceType Type,
    int HouseholdSize,
    decimal MonthlyIncome,
    string HouseholdSummary,
    string? ExtraFieldsJson) : IRequest<Result<Guid>>;

public sealed class SubmitSocialAssistanceApplicationCommandValidator
    : AbstractValidator<SubmitSocialAssistanceApplicationCommand>
{
    public SubmitSocialAssistanceApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicantUserId).NotEmpty();
        RuleFor(x => x.Type).IsInEnum();
        RuleFor(x => x.HouseholdSize).GreaterThanOrEqualTo(1);
        RuleFor(x => x.MonthlyIncome).GreaterThanOrEqualTo(0);
        RuleFor(x => x.HouseholdSummary).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.ExtraFieldsJson).MaximumLength(4000);
    }
}

public sealed class SubmitSocialAssistanceApplicationCommandHandler(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider)
    : IRequestHandler<SubmitSocialAssistanceApplicationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(
        SubmitSocialAssistanceApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var application = SocialAssistanceApplication.Submit(
            request.ApplicantUserId,
            request.Type,
            request.HouseholdSize,
            request.MonthlyIncome,
            request.HouseholdSummary,
            request.ExtraFieldsJson,
            dateTimeProvider.UtcNow);

        await unitOfWork.Repository<SocialAssistanceApplication>()
            .AddAsync(application, cancellationToken)
            .ConfigureAwait(false);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result<Guid>.Success(application.Id);
    }
}

public sealed record StartSocialAssistanceReviewCommand(Guid ApplicationId, Guid ReviewerUserId) : IRequest<Result>;

public sealed class StartSocialAssistanceReviewCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<StartSocialAssistanceReviewCommand, Result>
{
    public async Task<Result> Handle(StartSocialAssistanceReviewCommand request, CancellationToken cancellationToken)
    {
        var app = await unitOfWork.Repository<SocialAssistanceApplication>()
            .GetByIdAsync(request.ApplicationId, cancellationToken)
            .ConfigureAwait(false);

        if (app is null)
        {
            return Result.Failure("Başvuru bulunamadı.");
        }

        try
        {
            app.StartReview(request.ReviewerUserId);
        }
        catch (DomainException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<SocialAssistanceApplication>().Update(app);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record DecideSocialAssistanceApplicationCommand(
    Guid ApplicationId,
    Guid ReviewerUserId,
    bool Approve,
    string? Note) : IRequest<Result>;

public sealed class DecideSocialAssistanceApplicationCommandValidator
    : AbstractValidator<DecideSocialAssistanceApplicationCommand>
{
    public DecideSocialAssistanceApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty();
        RuleFor(x => x.ReviewerUserId).NotEmpty();
        RuleFor(x => x.Note).MaximumLength(1000);
        RuleFor(x => x.Note).NotEmpty().When(x => !x.Approve);
    }
}

public sealed class DecideSocialAssistanceApplicationCommandHandler(
    IUnitOfWork unitOfWork,
    IDateTimeProvider dateTimeProvider)
    : IRequestHandler<DecideSocialAssistanceApplicationCommand, Result>
{
    public async Task<Result> Handle(DecideSocialAssistanceApplicationCommand request, CancellationToken cancellationToken)
    {
        var app = await unitOfWork.Repository<SocialAssistanceApplication>()
            .GetByIdAsync(request.ApplicationId, cancellationToken)
            .ConfigureAwait(false);

        if (app is null)
        {
            return Result.Failure("Başvuru bulunamadı.");
        }

        try
        {
            if (request.Approve)
            {
                app.Approve(request.ReviewerUserId, request.Note, dateTimeProvider.UtcNow);
            }
            else
            {
                app.Reject(request.ReviewerUserId, request.Note!, dateTimeProvider.UtcNow);
            }
        }
        catch (Exception ex) when (ex is DomainException or ArgumentException)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<SocialAssistanceApplication>().Update(app);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}

public sealed record WithdrawSocialAssistanceApplicationCommand(Guid ApplicationId) : IRequest<Result>;

public sealed class WithdrawSocialAssistanceApplicationCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<WithdrawSocialAssistanceApplicationCommand, Result>
{
    public async Task<Result> Handle(WithdrawSocialAssistanceApplicationCommand request, CancellationToken cancellationToken)
    {
        var app = await unitOfWork.Repository<SocialAssistanceApplication>()
            .GetByIdAsync(request.ApplicationId, cancellationToken)
            .ConfigureAwait(false);

        if (app is null)
        {
            return Result.Failure("Başvuru bulunamadı.");
        }

        try
        {
            app.Withdraw();
        }
        catch (DomainException ex)
        {
            return Result.Failure(ex.Message);
        }

        unitOfWork.Repository<SocialAssistanceApplication>().Update(app);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
        return Result.Success();
    }
}
