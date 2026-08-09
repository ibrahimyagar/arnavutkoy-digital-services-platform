using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Persistence.Repositories;

/// <summary>
/// <see cref="IUnitOfWork"/> implementasyonu. Tek bir <see cref="ApplicationDbContext"/> örneği
/// üzerinden çalışır; bu sayede aynı HTTP isteği içinde açılan tüm repository'ler aynı EF Core
/// change tracker'ı paylaşır ve <see cref="SaveChangesAsync"/> tek bir veritabanı işlemi (transaction)
/// içinde tüm değişiklikleri kalıcı hale getirir.
/// </summary>
public sealed class UnitOfWork(ApplicationDbContext context) : IUnitOfWork
{
    public IRepository<T> Repository<T>() where T : Entity => new Repository<T>(context);

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) =>
        context.SaveChangesAsync(cancellationToken);
}
