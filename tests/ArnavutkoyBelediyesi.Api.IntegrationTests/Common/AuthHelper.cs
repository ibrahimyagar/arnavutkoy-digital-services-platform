using System.Net.Http.Headers;
using System.Net.Http.Json;
using ArnavutkoyBelediyesi.Application.Features.Auth.Dtos;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

/// <summary>
/// Test auth yardımcıları — giriş kimliği e-postadır.
/// Kayıt sonrası e-posta doğrulama zorunludur; login öncesi kod doğrulanır.
/// </summary>
public static class AuthHelper
{
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

    public static string GenerateUniqueEmail(string prefix = "citizen") =>
        $"{prefix}.{Guid.NewGuid():N}@test.arnavutkoy.local";

    public static async Task RegisterCitizenAsync(
        HttpClient client,
        string email,
        string password,
        string fullName = "Test Vatandaş")
    {
        var registerResponse = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            email,
            fullName,
            phoneNumber = "+905551112233",
            nationalId = GenerateValidNationalId(),
            birthDate = "1995-06-15",
            gender = "E",
            password,
        });
        registerResponse.EnsureSuccessStatusCode();
    }

    public static async Task VerifyEmailAsync(HttpClient client, string email)
    {
        if (!CapturingEmailSender.TryGetCode(email, out var code))
        {
            throw new InvalidOperationException($"Doğrulama kodu yakalanamadı: {email}");
        }

        var verifyResponse = await client.PostAsJsonAsync("/api/v1/auth/verify-email", new { email, code });
        verifyResponse.EnsureSuccessStatusCode();
    }

    public static async Task RegisterAndVerifyCitizenAsync(
        HttpClient client,
        string email,
        string password,
        string fullName = "Test Vatandaş")
    {
        await RegisterCitizenAsync(client, email, password, fullName);
        await VerifyEmailAsync(client, email);
    }

    public static async Task<AuthResultDto> RegisterAndLoginCitizenAsync(
        HttpClient client,
        string fullName = "Test Vatandaş",
        string password = "Test1234")
    {
        var email = GenerateUniqueEmail();
        await RegisterAndVerifyCitizenAsync(client, email, password, fullName);
        return await LoginAsync(client, email, password);
    }

    public static async Task<AuthResultDto> LoginAsync(HttpClient client, string email, string password)
    {
        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        loginResponse.EnsureSuccessStatusCode();

        var result = await loginResponse.ReadAsAsync<AuthResultDto>();
        return result ?? throw new InvalidOperationException("Giriş yanıtı boş döndü.");
    }

    public static void AttachBearerToken(HttpClient client, string accessToken) =>
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
}
