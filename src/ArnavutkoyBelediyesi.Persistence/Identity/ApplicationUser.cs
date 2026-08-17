using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Persistence.Identity;

/// <summary>
/// ASP.NET Core Identity kullanıcı kaydı. Giriş kimliği e-postadır; TCKN / doğum / cinsiyet profil alanıdır.
/// </summary>
public sealed class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;

    /// <summary>T.C. Kimlik No (opsiyonel profil alanı; kurgusal/demo).</summary>
    public string? NationalId { get; set; }

    /// <summary>Doğum tarihi (UTC günü olarak saklanır).</summary>
    public DateOnly? BirthDate { get; set; }

    /// <summary>Cinsiyet kodu: E (erkek), K (kadın).</summary>
    public string Gender { get; set; } = string.Empty;

    public DateTime CreatedAtUtc { get; set; }
}
