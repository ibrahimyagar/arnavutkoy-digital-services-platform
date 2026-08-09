using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;

/// <summary>
/// Bir talebi inceleme sürecine alır. Officer/Administrator rolü gerektirir.
/// </summary>
public sealed record MarkRequestUnderReviewCommand(Guid RequestId) : IRequest<Result>;

public sealed class MarkRequestUnderReviewCommandValidator : AbstractValidator<MarkRequestUnderReviewCommand>
{
    public MarkRequestUnderReviewCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
    }
}

public sealed class MarkRequestUnderReviewCommandHandler(IUnitOfWork unitOfWork)
    : IRequestHandler<MarkRequestUnderReviewCommand, Result>
{
    public async Task<Result> Handle(MarkRequestUnderReviewCommand request, CancellationToken cancellationToken)
    {
        var repository = unitOfWork.Repository<CitizenRequest>();
        var citizenRequest = await repository.GetByIdAsync(request.RequestId, cancellationToken).ConfigureAwait(false);

        if (citizenRequest is null)
        {
            return Result.Failure($"'{request.RequestId}' kimlikli talep bulunamadı.");
        }

        try
        {
            citizenRequest.MarkUnderReview();
        }
        catch (InvalidRequestStatusTransitionException ex)
        {
            return Result.Failure(ex.Message);
        }

        repository.Update(citizenRequest);
        await unitOfWork.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return Result.Success();
    }
}
