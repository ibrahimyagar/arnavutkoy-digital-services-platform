using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Application.Common.Models;
using ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Dtos;
using MediatR;

namespace ArnavutkoyBelediyesi.Application.Features.CitizenRequests.Queries;

/// <summary>
/// Bir talebi, tüm mesaj geçmişiyle birlikte (tek sorguda, N+1 oluşturmadan) getirir.
/// Erişim kontrolü (yalnızca talep sahibi vatandaş veya Officer/Administrator) API katmanında yapılır.
/// </summary>
public sealed record GetCitizenRequestByIdQuery(Guid RequestId) : IRequest<Result<CitizenRequestDto>>;

public sealed class GetCitizenRequestByIdQueryHandler(ICitizenRequestRepository repository)
    : IRequestHandler<GetCitizenRequestByIdQuery, Result<CitizenRequestDto>>
{
    public async Task<Result<CitizenRequestDto>> Handle(GetCitizenRequestByIdQuery request, CancellationToken cancellationToken)
    {
        var citizenRequest = await repository
            .GetByIdWithMessagesAsync(request.RequestId, cancellationToken)
            .ConfigureAwait(false);

        if (citizenRequest is null)
        {
            return Result<CitizenRequestDto>.Failure($"'{request.RequestId}' kimlikli talep bulunamadı.");
        }

        var dto = new CitizenRequestDto(
            citizenRequest.Id,
            citizenRequest.CitizenUserId,
            citizenRequest.CategoryId,
            citizenRequest.Status,
            citizenRequest.CreatedAtUtc,
            citizenRequest.ResolvedAtUtc,
            citizenRequest.Messages
                .OrderBy(m => m.SentAtUtc)
                .Select(m => new RequestMessageDto(m.Id, m.SenderUserId, m.SenderType, m.Message, m.SentAtUtc))
                .ToList());

        return Result<CitizenRequestDto>.Success(dto);
    }
}
