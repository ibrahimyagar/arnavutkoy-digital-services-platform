using System.Text;

namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// E-posta karşılaştırmasını kayıt ve girişte aynı kuralla yapar.
/// Türkçe İ/ı ve görünmez boşluklar, tarayıcı/klavye farkıyla "bazen bulunamayan" hesaba yol açmasın diye
/// ASCII i'ye katlanır; kültürden bağımsız küçük harfe çevrilir.
/// </summary>
public static class EmailNormalizer
{
    public static string Normalize(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return string.Empty;
        }

        var value = new string(email
                .Where(ch => ch is not '\u200B' and not '\uFEFF')
                .Select(ch => ch == '\u00A0' ? ' ' : ch)
                .ToArray())
            .Trim();

        value = value
            .Replace('\u0130', 'I')
            .Replace('\u0131', 'i');

        value = value.Normalize(NormalizationForm.FormKC);
        return value.ToLowerInvariant();
    }

    public static string ToLookupKey(string? email)
    {
        var normalized = Normalize(email);
        return normalized.Length == 0 ? string.Empty : normalized.ToUpperInvariant();
    }

    public static bool IsValid(string? email)
    {
        var normalized = Normalize(email);
        if (normalized.Length is 0 or > 256)
        {
            return false;
        }

        var at = normalized.IndexOf('@');
        if (at <= 0 || at != normalized.LastIndexOf('@') || at == normalized.Length - 1)
        {
            return false;
        }

        var domain = normalized[(at + 1)..];
        return domain.Contains('.')
            && !normalized.Contains(' ', StringComparison.Ordinal)
            && Uri.TryCreate($"mailto:{normalized}", UriKind.Absolute, out _);
    }
}
