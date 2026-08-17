using ArnavutkoyBelediyesi.Domain.Common;
using Microsoft.AspNetCore.Identity;

namespace ArnavutkoyBelediyesi.Persistence.Identity;

/// <summary>
/// Identity'nin varsayılan <see cref="UpperInvariantLookupNormalizer"/> değerinin üzerine,
/// kayıt/girişte kullanılan <see cref="EmailNormalizer"/> kurallarını uygular.
/// </summary>
public sealed class IdentityLookupNormalizer : ILookupNormalizer
{
    public string? NormalizeName(string? name) => name is null ? null : EmailNormalizer.ToLookupKey(name);

    public string? NormalizeEmail(string? email) => email is null ? null : EmailNormalizer.ToLookupKey(email);
}
