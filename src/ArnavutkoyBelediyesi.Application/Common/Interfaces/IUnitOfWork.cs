using ArnavutkoyBelediyesi.Domain.Common;

namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Bir iş biriminin (use-case) tüm repository değişikliklerini tek bir veritabanı işlemi (transaction)
/// içinde kalıcı hale getirmesini sağlar.
/// </summary>
public interface IUnitOfWork
{
    /// <summary>
    /// Belirtilen entity tipi için genel repository'yi döner.
    /// </summary>
    IRepository<T> Repository<T>() where T : Entity;

    /// <summary>
    /// Birikmiş tüm değişiklikleri veritabanına kalıcı hale getirir ve domain olaylarını dağıtır.
    /// </summary>
    /// <returns>Etkilenen kayıt sayısı.</returns>
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
