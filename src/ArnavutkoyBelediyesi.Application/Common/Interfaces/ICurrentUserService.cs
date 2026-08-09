namespace ArnavutkoyBelediyesi.Application.Common.Interfaces;

/// <summary>
/// Geçerli HTTP isteğini gerçekleştiren kimliği doğrulanmış kullanıcı hakkında bilgi sağlar.
/// Implementasyonu Infrastructure katmanında, <c>HttpContext</c> claim'lerinden okunarak yapılır.
/// </summary>
public interface ICurrentUserService
{
    /// <summary>
    /// Geçerli kullanıcının kimliği; kimliği doğrulanmamışsa null.
    /// </summary>
    Guid? UserId { get; }

    /// <summary>
    /// İsteğin kimliği doğrulanmış bir kullanıcıya ait olup olmadığı.
    /// </summary>
    bool IsAuthenticated { get; }

    /// <summary>
    /// Geçerli kullanıcının sahip olduğu roller.
    /// </summary>
    IReadOnlyCollection<string> Roles { get; }
}
