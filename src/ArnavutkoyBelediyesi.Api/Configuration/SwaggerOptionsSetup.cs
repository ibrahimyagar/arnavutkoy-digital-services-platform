using Asp.Versioning.ApiExplorer;
using Microsoft.Extensions.Options;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Keşfedilen her API versiyonu için ayrı bir Swagger dokümanı tanımlar. <see cref="IApiVersionDescriptionProvider"/>
/// üzerinden versiyonlar dinamik olarak okunur; yeni bir versiyon eklendiğinde bu sınıfın değişmesi gerekmez.
/// </summary>
public sealed class SwaggerOptionsSetup(IApiVersionDescriptionProvider apiVersionDescriptionProvider)
    : IConfigureOptions<SwaggerGenOptions>
{
    public void Configure(SwaggerGenOptions options)
    {
        foreach (var description in apiVersionDescriptionProvider.ApiVersionDescriptions)
        {
            options.SwaggerDoc(description.GroupName, CreateOpenApiInfo(description.ApiVersion.ToString(), description.IsDeprecated));
        }

        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "JWT erişim jetonunu 'Bearer {token}' biçiminde girin."
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    }

    private static OpenApiInfo CreateOpenApiInfo(string version, bool isDeprecated) => new()
    {
        Title = "Arnavutköy Belediyesi Dijital Hizmetler API",
        Version = version,
        Description = isDeprecated
            ? "Bu API sürümü kullanımdan kaldırılmıştır (deprecated)."
            : "Bağımsız bir portföy/demo çalışmasıdır; herhangi bir resmi belediye kurumunu temsil etmez.",
    };
}
