using ArnavutkoyBelediyesi.Domain.CitizenRequests;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// <see cref="CitizenRequest"/> aggregate'i için, mesaj geçmişini tek sorguda (N+1 problemi
/// oluşturmadan) birlikte getiren özelleşmiş sorgu metotlarını tanımlar.
/// </summary>
public interface ICitizenRequestRepository : IRepository<CitizenRequest>
{
    /// <summary>
    /// Talebi, tüm mesaj geçmişiyle birlikte tek sorguda getirir.
    /// </summary>
    Task<CitizenRequest?> GetByIdWithMessagesAsync(Guid id, CancellationToken cancellationToken = default);
}
