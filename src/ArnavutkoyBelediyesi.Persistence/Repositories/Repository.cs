using ArnavutkoyBelediyesi.Application.Common.Interfaces;
using ArnavutkoyBelediyesi.Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Persistence.Repositories;

/// <summary>
/// <see cref="IRepository{T}"/> için EF Core tabanlı genel implementasyon.
/// </summary>
/// <typeparam name="T">Domain entity tipi.</typeparam>
public class Repository<T>(ApplicationDbContext context) : IRepository<T> where T : Entity
{
    /// <summary>
    /// Türetilmiş repository'lerin özelleşmiş sorgular (ör. <c>Include</c>) yazabilmesi için
    /// korumalı olarak açılan veritabanı bağlamı.
    /// </summary>
    protected ApplicationDbContext Context { get; } = context;

    public virtual async Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        await Context.Set<T>()
            .FirstOrDefaultAsync(entity => entity.Id == id, cancellationToken)
            .ConfigureAwait(false);

    public virtual IQueryable<T> Query() => Context.Set<T>().AsNoTracking();

    public virtual async Task AddAsync(T entity, CancellationToken cancellationToken = default) =>
        await Context.Set<T>().AddAsync(entity, cancellationToken).ConfigureAwait(false);

    /// <summary>
    /// Entity zaten izleniyorsa (tracked) hiçbir şey yapmaz; EF Core değişiklik izleyicisi
    /// property ve koleksiyon değişikliklerini zaten yakalar. Yalnızca detached entity'ler için
    /// <see cref="DbSet{TEntity}.Update"/> çağrılır.
    /// <para>
    /// Bu ayrım kritiktir: <c>Update()</c> grafikteki tüm entity'leri (yeni eklenen çocuklar
    /// dahil) <see cref="EntityState.Modified"/> olarak işaretler. Domain entity'lerimizin
    /// kimlikleri <c>Guid.NewGuid()</c> ile üretildiği için yeni çocuklar "var olan kayıt"
    /// sanılır; ardından veritabanında bulunamayan satır için
    /// <c>DbUpdateConcurrencyException</c> fırlatılır.
    /// </para>
    /// </summary>
    public virtual void Update(T entity)
    {
        var entry = Context.Entry(entity);
        if (entry.State == EntityState.Detached)
        {
            Context.Set<T>().Update(entity);
        }
    }

    public virtual void Remove(T entity) => Context.Set<T>().Remove(entity);
}
