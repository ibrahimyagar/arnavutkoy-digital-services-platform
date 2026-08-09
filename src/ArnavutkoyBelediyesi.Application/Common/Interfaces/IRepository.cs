using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Bir aggregate root için temel CRUD operasyonlarını tanımlayan genel repository sözleşmesi.
/// Sorgu tarafı, projeksiyon ve <c>Include</c> ihtiyacı olan handler'lar <see cref="Query"/>
/// aracılığıyla LINQ ile okuma yapar; bu N+1 sorgu problemini engeller.
/// </summary>
/// <typeparam name="T">Domain entity tipi.</typeparam>
public interface IRepository<T> where T : Entity
{
    /// <summary>
    /// Kimliğe göre tek bir entity getirir; bulunamazsa null döner.
    /// </summary>
    Task<T?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);

    /// <summary>
    /// İzleme (tracking) kapalı, salt okunur sorgulama için temel <see cref="IQueryable{T}"/> döner.
    /// Soft-delete filtresi otomatik uygulanır.
    /// </summary>
    IQueryable<T> Query();

    /// <summary>
    /// Yeni bir entity ekler. Kalıcı hale gelmesi için <see cref="IUnitOfWork.SaveChangesAsync"/> çağrılmalıdır.
    /// </summary>
    Task AddAsync(T entity, CancellationToken cancellationToken = default);

    /// <summary>
    /// Var olan bir entity'nin değişiklik takibini işaretler.
    /// </summary>
    void Update(T entity);

    /// <summary>
    /// Bir entity'yi kaldırır (soft-delete destekleyen entity'lerde <see cref="AuditableEntity.IsDeleted"/> set edilir).
    /// </summary>
    void Remove(T entity);
}
