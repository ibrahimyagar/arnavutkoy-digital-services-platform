namespace ArnavutkoyBelediyesi.Domain.Common;

/// <summary>
/// T.C. Kimlik Numarası'nın resmî sağlama (checksum) algoritmasını uygular. Bu proje giriş
/// kullanıcı adı olarak T.C. Kimlik Numarası kullandığından (bkz. ASSUMPTIONS.md → A6), kayıt
/// sırasında biçimsel geçerliliğin sunucu tarafında da doğrulanması gerekir; yalnızca istemci
/// tarafı doğrulamasına güvenmek, referans projedeki eksik sunucu tarafı validasyonu sorununun
/// bir başka örneği olurdu.
/// </summary>
public static class TurkishNationalIdValidator
{
    /// <summary>
    /// Verilen değerin, geçerli bir T.C. Kimlik Numarası biçimine ve sağlama toplamına uyup uymadığını denetler.
    /// </summary>
    public static bool IsValid(string? nationalId)
    {
        if (string.IsNullOrWhiteSpace(nationalId) || nationalId.Length != 11 || nationalId[0] == '0')
        {
            return false;
        }

        if (!nationalId.All(char.IsAsciiDigit))
        {
            return false;
        }

        var digits = nationalId.Select(c => c - '0').ToArray();

        var oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        var evenSum = digits[1] + digits[3] + digits[5] + digits[7];

        var tenthDigitCheck = ((oddSum * 7) - evenSum) % 10;
        if (tenthDigitCheck < 0)
        {
            tenthDigitCheck += 10;
        }

        if (tenthDigitCheck != digits[9])
        {
            return false;
        }

        var eleventhDigitCheck = (oddSum + evenSum + digits[9]) % 10;

        return eleventhDigitCheck == digits[10];
    }
}
