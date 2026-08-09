using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using ArnavutkoyBelediyesi.Domain.Exceptions;
using FluentValidation;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Commands;

/// <summary>
/// Bir talebe (vatandaş veya görevli tarafından) yeni bir mesaj ekler. Kapatılmış taleplere
/// mesaj eklenemez (domain kuralı, bkz. <see cref="CitizenRequest.AddMessage"/>).
/// </summary>
public sealed record AddRequestMessageCommand(Guid RequestId, Guid SenderUserId, SenderType SenderType, string Message)
    : IRequest<Result>;

public sealed class AddRequestMessageCommandValidator : AbstractValidator<AddRequestMessageCommand>
{
    public AddRequestMessageCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.SenderUserId).NotEmpty();
        RuleFor(x => x.Message).NotEmpty().MaximumLength(2000);
    }
}

public sealed class AddRequestMessageCommandHandler(ICitizenRequestRepository repository, IUnitOfWork unitOfWork)
    : IRequestHandler<AddRequestMessageCommand, Result>
{
    public async Task<Result> Handle(AddRequestMessageCommand request, CancellationToken cancellationToken)
    {
        var citizenRequest = await repository.GetByIdWithMessagesAsync(request.RequestId, cancellationToken).ConfigureAwait(false);

        if (citizenRequest is null)
        {
            return Result.Failure($"'{request.RequestId}' kimlikli talep bulunamadı.");
        }

        try
        {
            citizenRequest.AddMessage(request.SenderUserId, request.SenderType, request.Message);
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
