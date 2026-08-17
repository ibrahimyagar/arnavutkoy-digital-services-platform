namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// Telefon numarasındaki boşluk ve ayırıcıları temizler; kayıt doğrulamasıyla aynı biçimi üretir.
/// </summary>
public static class PhoneNumberNormalizer
{
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        var trimmed = value.Trim();
        var hasPlus = trimmed.StartsWith('+');
        var digits = new string(trimmed.Where(char.IsDigit).ToArray());
        if (digits.Length > 15)
        {
            digits = digits[..15];
        }

        return hasPlus ? "+" + digits : digits;
    }

    public static bool IsPlausible(string? value)
    {
        var normalized = Normalize(value);
        return System.Text.RegularExpressions.Regex.IsMatch(normalized, @"^\+?\d{10,15}$");
    }
}
