namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Sistem zamanına dolaylı erişim sağlar; handler'ların doğrudan <see cref="DateTime.UtcNow"/>
/// çağırmasını önleyerek birim testlerinde zamanın sahtelenebilmesini (mocking) mümkün kılar.
/// </summary>
public interface IDateTimeProvider
{
    /// <summary>
    /// Şu anki UTC zaman.
    /// </summary>
    DateTime UtcNow { get; }
}
