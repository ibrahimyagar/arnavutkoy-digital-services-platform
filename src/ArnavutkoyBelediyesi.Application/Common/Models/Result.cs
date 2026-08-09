namespace ArnavutkoyBelediyesi.Application.Common.Models;

/// <summary>
/// Bir use-case'in dönüş değeri taşımayan sonucunu, exception fırlatmadan başarı/hata olarak
/// ifade eder. Global middleware yalnızca beklenmeyen (öngörülemeyen) durumları HTTP 500'e çevirir;
/// beklenen iş kuralı ihlalleri bu tip aracılığıyla akış kontrolüyle yönetilir.
/// </summary>
public class Result
{
    protected Result(bool isSuccess, IReadOnlyCollection<string> errors)
    {
        if (isSuccess && errors.Count > 0)
        {
            throw new InvalidOperationException("Başarılı bir sonuç hata içeremez.");
        }

        if (!isSuccess && errors.Count == 0)
        {
            throw new InvalidOperationException("Başarısız bir sonuç en az bir hata içermelidir.");
        }

        IsSuccess = isSuccess;
        Errors = errors;
    }

    /// <summary>
    /// İşlemin başarılı olup olmadığı.
    /// </summary>
    public bool IsSuccess { get; }

    /// <summary>
    /// İşlem başarısızsa oluşan hata mesajları.
    /// </summary>
    public IReadOnlyCollection<string> Errors { get; }

    /// <summary>
    /// Başarılı bir sonuç oluşturur.
    /// </summary>
    public static Result Success() => new(true, Array.Empty<string>());

    /// <summary>
    /// Tek hata mesajı içeren başarısız bir sonuç oluşturur.
    /// </summary>
    public static Result Failure(string error) => new(false, [error]);

    /// <summary>
    /// Birden fazla hata mesajı içeren başarısız bir sonuç oluşturur.
    /// </summary>
    public static Result Failure(IReadOnlyCollection<string> errors) => new(false, errors);
}

/// <summary>
/// Başarılı olduğunda bir değer taşıyan <see cref="Result"/> uzantısı.
/// </summary>
/// <typeparam name="T">Başarı durumunda döndürülecek değerin tipi.</typeparam>
public sealed class Result<T> : Result
{
    private readonly T? _value;

    private Result(bool isSuccess, T? value, IReadOnlyCollection<string> errors) : base(isSuccess, errors)
    {
        _value = value;
    }

    /// <summary>
    /// Başarılı sonucun değeri. Başarısız bir sonuçta okunmaya çalışılırsa istisna fırlatır.
    /// </summary>
    public T Value => IsSuccess
        ? _value!
        : throw new InvalidOperationException("Başarısız bir sonuçtan değer okunamaz.");

    /// <summary>
    /// Başarılı, değer taşıyan bir sonuç oluşturur.
    /// </summary>
    public static Result<T> Success(T value) => new(true, value, Array.Empty<string>());

    /// <summary>
    /// Tek hata mesajı içeren başarısız bir sonuç oluşturur.
    /// </summary>
    public static new Result<T> Failure(string error) => new(false, default, [error]);

    /// <summary>
    /// Birden fazla hata mesajı içeren başarısız bir sonuç oluşturur.
    /// </summary>
    public static new Result<T> Failure(IReadOnlyCollection<string> errors) => new(false, default, errors);

    public static implicit operator Result<T>(T value) => Success(value);
}
