namespace ArnavutkoyBelediyesi.Domain.Exceptions;

/// <summary>
/// Bir domain iş kuralı ihlal edildiğinde fırlatılan istisnaların taban sınıfı.
/// Bu istisnalar Application katmanında yakalanıp <c>Result</c> tipine dönüştürülür;
/// API'ye asla ham stack trace olarak sızdırılmaz.
/// </summary>
public abstract class DomainException : Exception
{
    protected DomainException(string message) : base(message)
    {
    }
}
