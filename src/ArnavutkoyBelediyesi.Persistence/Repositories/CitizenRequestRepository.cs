using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.CitizenRequests;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Persistence.Repositories;

/// <summary>
/// <see cref="ICitizenRequestRepository"/> implementasyonu. Talep ve mesaj geçmişini
/// <c>Include</c> ile tek sorguda getirir; bu, referans projedeki talep + mesajların ayrı
/// ayrı sorgulanmasından kaynaklanan N+1 probleminin düzeltilmiş hâlidir.
/// </summary>
public sealed class CitizenRequestRepository(ApplicationDbContext context)
    : Repository<CitizenRequest>(context), ICitizenRequestRepository
{
    public async Task<CitizenRequest?> GetByIdWithMessagesAsync(Guid id, CancellationToken cancellationToken = default) =>
        await Context.Set<CitizenRequest>()
            .Include(request => request.Messages)
            .FirstOrDefaultAsync(request => request.Id == id, cancellationToken)
            .ConfigureAwait(false);
}
