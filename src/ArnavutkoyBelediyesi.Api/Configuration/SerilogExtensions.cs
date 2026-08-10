using Serilog;
using Serilog.Events;

namespace ArnavutkoyBelediyesi.Api.Configuration;

/// <summary>
/// Serilog yapılandırması: konsol (Docker/stdout) varsayılan; Seq adresi verilmişse ek sink.
/// Kart numarası / CVV / parola gibi hassas alanlar bilerek log şablonuna alınmaz;
/// request logging yalnızca metod, path, status ve süre yazar.
/// </summary>
public static class SerilogExtensions
{
    public static WebApplicationBuilder AddApiSerilog(this WebApplicationBuilder builder)
    {
        builder.Host.UseSerilog((context, _, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext()
                .Enrich.WithProperty("Application", "ArnavutkoyBelediyesi.Api")
                .Enrich.WithEnvironmentName()
                .WriteTo.Console();

            var seqServerUrl = context.Configuration["Serilog:Seq:ServerUrl"];
            if (!string.IsNullOrWhiteSpace(seqServerUrl))
            {
                loggerConfiguration.WriteTo.Seq(seqServerUrl);
            }
        });

        return builder;
    }

    public static WebApplication UseApiSerilogRequestLogging(this WebApplication app)
    {
        app.UseSerilogRequestLogging(options =>
        {
            options.GetLevel = (httpContext, _, exception) =>
            {
                if (exception is not null)
                {
                    return LogEventLevel.Error;
                }

                // Healthcheck gürültüsünü Information seviyesinden düşür.
                if (httpContext.Request.Path.StartsWithSegments("/health"))
                {
                    return LogEventLevel.Debug;
                }

                var statusCode = httpContext.Response.StatusCode;
                return statusCode >= 500
                    ? LogEventLevel.Error
                    : statusCode >= 400
                        ? LogEventLevel.Warning
                        : LogEventLevel.Information;
            };

            options.MessageTemplate =
                "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        });

        return app;
    }
}
