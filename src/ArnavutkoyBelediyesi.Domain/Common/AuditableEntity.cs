namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// Oluşturulma/güncellenme bilgisi ve yumuşak silme (soft delete) desteği gerektiren entity'ler
/// için taban sınıf. Bu alanlar Persistence katmanındaki <c>SaveChanges</c> interceptor'ı
/// tarafından otomatik doldurulur; domain kodu bu alanları elle set etmez.
/// </summary>
public abstract class AuditableEntity : Entity
{
    /// <summary>
    /// Kaydın oluşturulduğu UTC zaman.
    /// </summary>
    public DateTime CreatedAtUtc { get; internal set; }

    /// <summary>
    /// Kaydı oluşturan kullanıcının kimliği (varsa).
    /// </summary>
    public string? CreatedBy { get; internal set; }

    /// <summary>
    /// Kaydın son güncellendiği UTC zaman.
    /// </summary>
    public DateTime? UpdatedAtUtc { get; internal set; }

    /// <summary>
    /// Kaydı son güncelleyen kullanıcının kimliği (varsa).
    /// </summary>
    public string? UpdatedBy { get; internal set; }

    /// <summary>
    /// Kaydın yumuşak silinip silinmediği. Silinen kayıtlar sorgulardan otomatik hariç tutulur.
    /// </summary>
    public bool IsDeleted { get; internal set; }
}
