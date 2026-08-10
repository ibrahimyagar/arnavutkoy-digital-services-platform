using System.Text.Json.Serialization;
using Asp.Versioning;
using Asp.Versioning.ApiExplorer;
using ArnavutkoyBelediyesi.Api.Configuration;
using ArnavutkoyBelediyesi.Api.Middleware;
using ArnavutkoyBelediyesi.Application;
using ArnavutkoyBelediyesi.Infrastructure;
using ArnavutkoyBelediyesi.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddControllers()
    .AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.AddProblemDetails();
builder.Services.AddAuthorization();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddApiRateLimiting();
builder.Services.AddApiCors(builder.Configuration, builder.Environment);
builder.Services.AddApiHealthChecks(builder.Configuration);

builder.Services
    .AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        options.ApiVersionReader = new UrlSegmentApiVersionReader();
    })
    .AddMvc()
    .AddApiExplorer(options =>
    {
        options.GroupNameFormat = "'v'VVV";
        options.SubstituteApiVersionInUrl = true;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.ConfigureOptions<SwaggerOptionsSetup>();
builder.Services.AddSwaggerGen(options =>
{
    var xmlFileName = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlFilePath = Path.Combine(AppContext.BaseDirectory, xmlFileName);
    if (File.Exists(xmlFilePath))
    {
        options.IncludeXmlComments(xmlFilePath);
    }
});

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddInfrastructure();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Bu proje bir portföy/demo çalışması olduğundan Swagger, canlı ortamda da bilinçli olarak
// açık bırakılabilir (varsayılan: true) ancak "Swagger:Enabled=false" ortam değişkeniyle
// istenen bir ortamda tamamen kapatılabilir (bkz. docs/ASSUMPTIONS.md).
if (app.Configuration.GetValue("Swagger:Enabled", defaultValue: true))
{
    var apiVersionDescriptionProvider = app.Services.GetRequiredService<IApiVersionDescriptionProvider>();

    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        foreach (var description in apiVersionDescriptionProvider.ApiVersionDescriptions)
        {
            options.SwaggerEndpoint($"/swagger/{description.GroupName}/swagger.json", description.GroupName.ToUpperInvariant());
        }
    });
}

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Docker / ters vekil arkasında TLS genelde dışarıda sonlanır; konteyner yalnızca HTTP dinler.
// DISABLE_HTTPS_REDIRECTION=true (docker-compose varsayılanı) ile yönlendirme kapatılır.
if (!string.Equals(
        Environment.GetEnvironmentVariable("DISABLE_HTTPS_REDIRECTION"),
        "true",
        StringComparison.OrdinalIgnoreCase))
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsExtensions.PolicyName);

// "Testing" ortamında (WebApplicationFactory tabanlı API entegrasyon testleri) hız sınırlama
// devre dışı bırakılır; aksi hâlde aynı IP'den (TestServer'da hepsi "unknown" bölümüne düşer)
// kısa sürede çok sayıda istek atan test paketleri, gerçek bir güvenlik açığı olmaksızın
// 429 alır. Üretim ve Development ortamlarında davranış değişmez.
if (!app.Environment.IsEnvironment("Testing"))
{
    app.UseRateLimiter();
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapApiHealthChecks();

await app.InitializeDatabaseAsync().ConfigureAwait(false);

app.Run();

/// <summary>
/// WebApplicationFactory tabanlı entegrasyon testlerinin uygulamayı başlatabilmesi için
/// üst düzey (top-level) Program sınıfını dışa açan kısmi bildirim.
/// </summary>
public partial class Program;
