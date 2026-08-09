using Microsoft.EntityFrameworkCore;

namespace ArnavutkoyBelediyesi.Application.Common.Models;

/// <summary>
/// Sayfalanmış bir sorgu sonucunu, toplam kayıt sayısı ve sayfa bilgisiyle birlikte taşır.
/// Referans projedeki "her listeyi sınırsız şekilde döken" anti-pattern'in düzeltilmiş hâlidir.
/// </summary>
/// <typeparam name="T">Sayfalanan öğe tipi.</typeparam>
public sealed class PaginatedList<T>
{
    public PaginatedList(IReadOnlyCollection<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }

    /// <summary>
    /// Geçerli sayfadaki öğeler.
    /// </summary>
    public IReadOnlyCollection<T> Items { get; }

    /// <summary>
    /// Tüm sayfalar dahil toplam kayıt sayısı.
    /// </summary>
    public int TotalCount { get; }

    /// <summary>
    /// 1 tabanlı geçerli sayfa numarası.
    /// </summary>
    public int PageNumber { get; }

    /// <summary>
    /// Sayfa başına kayıt sayısı.
    /// </summary>
    public int PageSize { get; }

    /// <summary>
    /// Toplam sayfa sayısı.
    /// </summary>
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);

    /// <summary>
    /// Verilen <see cref="IQueryable{T}"/> kaynağından, veritabanı seviyesinde sayfalama uygulayarak
    /// bir <see cref="PaginatedList{T}"/> oluşturur.
    /// </summary>
    public static async Task<PaginatedList<T>> CreateAsync(
        IQueryable<T> source,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageNumber = pageNumber < 1 ? 1 : pageNumber;
        pageSize = pageSize is < 1 or > 100 ? 20 : pageSize;

        var totalCount = await source.CountAsync(cancellationToken).ConfigureAwait(false);

        var items = await source
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken)
            .ConfigureAwait(false);

        return new PaginatedList<T>(items, totalCount, pageNumber, pageSize);
    }
}
