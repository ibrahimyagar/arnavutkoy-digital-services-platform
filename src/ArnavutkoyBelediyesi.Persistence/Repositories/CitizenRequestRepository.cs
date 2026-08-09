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

    /// <summary>
    /// Aggregate üzerindeki yeni <see cref="RequestMessage"/> çocuklarını EF Core'a
    /// <see cref="EntityState.Added"/> olarak bildirir, ardından taban <c>Update</c>
    /// davranışını uygular.
    /// <para>
    /// Domain entity'ler istemci tarafında <c>Guid.NewGuid()</c> ile kimlik üretir. EF Core,
    /// izlenen bir koleksiyona eklenen ve anahtarı boş olmayan entity'leri varsayılan olarak
    /// <see cref="EntityState.Modified"/> kabul eder; satır veritabanında olmadığı için
    /// <c>SaveChanges</c> <c>DbUpdateConcurrencyException</c> fırlatır. Mesajlar değiştirilemez
    /// (immutable) olduğu için <see cref="EntityState.Modified"/> durumundaki her mesaj aslında
    /// yeni eklenmiş demektir ve güvenle <see cref="EntityState.Added"/> yapılır.
    /// </para>
    /// </summary>
    public override void Update(CitizenRequest entity)
    {
        foreach (var message in entity.Messages)
        {
            var entry = Context.Entry(message);
            if (entry.State is EntityState.Detached or EntityState.Modified)
            {
                entry.State = EntityState.Added;
            }
        }

        base.Update(entity);
    }
}
