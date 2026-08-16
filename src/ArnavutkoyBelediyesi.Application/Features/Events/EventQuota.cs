using System.Globalization;
using System.Text.RegularExpressions;

namespace ArnavutkoyBelediyesi.Application.Features.Events;

/// <summary>
/// Etkinlik gövdesindeki "Kontenjan:" satırından sayısal kapasiteyi okur.
/// Sayı yoksa (ör. "Alan kapasitesi") sınır uygulanmaz.
/// </summary>
public static class EventQuota
{
    private static readonly Regex FirstNumber = new(@"\d+", RegexOptions.Compiled);

    public static int? TryParse(string? body)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return null;
        }

        foreach (var raw in body.Replace("\r\n", "\n", StringComparison.Ordinal).Split('\n'))
        {
            var line = raw.Trim();
            if (!line.StartsWith("Kontenjan:", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            var match = FirstNumber.Match(line);
            if (!match.Success)
            {
                return null;
            }

            return int.TryParse(match.Value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var quota)
                ? quota
                : null;
        }

        return null;
    }
}
