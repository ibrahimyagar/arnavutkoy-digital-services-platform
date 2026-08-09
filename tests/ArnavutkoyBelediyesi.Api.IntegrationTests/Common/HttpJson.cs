using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ArnavutkoyBelediyesi.Api.IntegrationTests.Common;

/// <summary>
/// API'nin ürettiği camelCase JSON gövdelerini test DTO'larına deserialize etmek için
/// paylaşılan <see cref="JsonSerializerOptions"/> ve yardımcı uzantı metotları.
/// API tarafında <see cref="JsonStringEnumConverter"/> kullanıldığı için burada da aynı
/// dönüştürücü kayıtlıdır; aksi hâlde string enum değerleri (ör. <c>"Pending"</c>)
/// deserialize edilemez.
/// </summary>
public static class HttpJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter() },
    };

    public static Task<T?> ReadAsAsync<T>(this HttpResponseMessage response) =>
        response.Content.ReadFromJsonAsync<T>(Options);
}

/// <summary>
/// <c>Created(...)</c> sonuçlarının anonim <c>{ id }</c> gövdesini karşılamak için kullanılan DTO.
/// </summary>
public sealed record CreatedIdResponse(Guid Id);

/// <summary>
/// RFC 7807 <c>ProblemDetails</c> gövdesinin, testlerde kullanılan minimal görünümü.
/// </summary>
public sealed record ProblemDetailsResponse(string? Title, string? Detail, int? Status);
