using System.Net.Http.Headers;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

/// <summary>
/// Testlerde tekrarlanan "yeni bir vatandaş kaydet ve giriş yap" / "demo kullanıcı olarak giriş
/// yap" / "istemciye Bearer token ekle" adımlarını tek bir yerde toplayan yardımcı sınıf.
/// </summary>
public static class AuthHelper
{
    /// <summary>
    /// Rastgele ama geçerli bir sağlama toplamına (checksum) sahip T.C. Kimlik Numarası üretir;
    /// böylece her test kendi benzersiz kullanıcısını oluşturabilir.
    /// </summary>
    public static string GenerateValidNationalId()
    {
        var random = Random.Shared;
        var digits = new int[9];
        digits[0] = random.Next(1, 9);
        for (var i = 1; i < 9; i++)
        {
            digits[i] = random.Next(0, 9);
        }

        var oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
        var evenSum = digits[1] + digits[3] + digits[5] + digits[7];

        var tenthDigit = ((oddSum * 7) - evenSum) % 10;
        if (tenthDigit < 0)
        {
            tenthDigit += 10;
        }

        var eleventhDigit = (oddSum + evenSum + tenthDigit) % 10;

        return string.Concat(digits) + tenthDigit + eleventhDigit;
    }

    public static async Task<AuthResultDto> RegisterAndLoginCitizenAsync(
        HttpClient client,
        string fullName = "Test Vatandaş",
        string password = "Test1234")
    {
        var nationalId = GenerateValidNationalId();

        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            nationalId,
            fullName,
            phoneNumber = "+905551112233",
            password,
        });
        registerResponse.EnsureSuccessStatusCode();

        return await LoginAsync(client, nationalId, password);
    }

    public static async Task<AuthResultDto> LoginAsync(HttpClient client, string nationalId, string password)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new { nationalId, password });
        loginResponse.EnsureSuccessStatusCode();

        var result = await loginResponse.ReadAsAsync<AuthResultDto>();
        return result ?? throw new InvalidOperationException("Giriş yanıtı boş döndü.");
    }

    public static void AttachBearerToken(HttpClient client, string accessToken) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
}
