namespace ArnavutkoyBelediyesi.Persistence.Seed;

/// <summary>
/// Arnavutköy İETT hat kataloğu — demo durak sıraları (Ağustos 2026 tarifesi).
/// Ara duraklar gerçekçi mahalle/kavşak adlarıdır; resmi İETT GPS verisi değildir.
/// </summary>
internal static class BusLineCatalogSeed
{
    internal static readonly Dictionary<string, string[]> StopsByCode = new(StringComparer.OrdinalIgnoreCase)
    {
        ["336"] =
        [
            "Arnavutköy Merkez Peronlar",
            "Taşoluk",
            "Hadımköy Kavşağı",
            "Bağcılar Meydan",
            "Topkapı",
            "Eminönü İskele",
        ],
        ["336A"] =
        [
            "Balaban Köyü",
            "Arnavutköy Merkez",
            "Taşoluk",
            "Mescidi Selam",
        ],
        ["336M"] =
        [
            "Arnavutköy Merkez Peronlar",
            "Taşoluk",
            "Başakşehir Metro",
            "Mecidiyeköy",
        ],
        ["336G"] =
        [
            "Taşoluk Peronlar",
            "Kiptaş Konutları",
            "İkitelli OSB",
            "Tekstilkent Metro",
        ],
        ["336H"] =
        [
            "Hadımköy Merkez",
            "Yassıören",
            "Arnavutköy Peronlar",
            "Mescidi Selam",
        ],
        ["336K"] =
        [
            "Yeniköy",
            "Karaburun",
            "Baklalı Köyü",
            "Arnavutköy Merkez",
            "Mescidi Selam",
        ],
        ["36AS"] =
        [
            "Taşoluk Peronlar",
            "Arnavutköy Merkez",
            "Hadımköy",
            "Sefaköy Metrobüs",
        ],
        ["36AY"] =
        [
            "Arnavutköy Merkez Peronlar",
            "Taşoluk Peronlar",
            "Hadımköy",
            "Yenibosna Metro",
        ],
        ["36B"] =
        [
            "Bolluca",
            "Boğazköy",
            "Cebeci Merkez",
            "Arnavutköy Merkez",
        ],
        ["36CB"] =
        [
            "Cebeci Köyü",
            "Cebeci Merkez",
            "İstiklal Mahallesi",
            "Mescidi Selam",
        ],
        ["36D"] =
        [
            "Arnavutköy Merkez",
            "Hacımaşlı",
            "Deliklikaya Merkez",
        ],
        ["36HT"] =
        [
            "Fatih Mahallesi",
            "Haraççı",
            "Cebeci Merkez",
        ],
        ["36Y"] =
        [
            "Taşoluk Peronlar",
            "İstiklal Mahallesi",
            "Mahmutbey Metro",
            "Yenikapı",
        ],
        ["36YS"] =
        [
            "Yassıören",
            "Hadımköy",
            "Arnavutköy Peronlar",
        ],
        ["MK22"] =
        [
            "Taşoluk Peronlar",
            "Başakşehir",
            "Metrokent",
        ],
        ["HT18"] =
        [
            "Hadımköy Merkez",
            "İ.Ü. Cerrahpaşa Kampüsü",
            "Tüyap Fuar Merkezi",
        ],
        ["H-6"] =
        [
            "Yunus Emre Mahallesi",
            "Arnavutköy Merkez",
            "Nene Hatun Parkı",
            "İstanbul Havalimanı",
        ],
        ["418"] =
        [
            "Hadımköy Merkez",
            "Haramidere",
        ],
        ["48KA"] =
        [
            "Kemerburgaz",
            "Arnavutköy Merkez",
        ],
        ["48M"] =
        [
            "Akpınar Köyü",
            "Arnavutköy Merkez",
        ],
        ["144A"] =
        [
            "Deliklikaya",
            "Avcılar Metrobüs",
        ],
        ["144B"] =
        [
            "Deliklikaya",
            "Yeşilbayır Köyü",
            "Yeşilkent",
        ],
        ["144H"] =
        [
            "Heybetli Sokak",
            "Deliklikaya",
            "Haramidere",
        ],
        ["144K"] =
        [
            "Ömerli KİPTAŞ",
            "2801. Sokak",
            "Esenkent",
        ],
        ["144M"] =
        [
            "Deliklikaya",
            "Mahmutbey Metro",
        ],
    };

    internal static string[] ResolveStops(string code, string[] fallbackEndpoints)
    {
        return StopsByCode.TryGetValue(code, out var stops) ? stops : fallbackEndpoints;
    }
}
