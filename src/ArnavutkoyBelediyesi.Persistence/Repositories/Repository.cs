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

    public virtual void Update(T entity) => Context.Set<T>().Update(entity);

    public virtual void Remove(T entity) => Context.Set<T>().Remove(entity);
}
