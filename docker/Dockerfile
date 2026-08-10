# Bağlam: depo kökü (docker-compose build context = ..)
# Örnek: docker build -f docker/Dockerfile -t arnavutkoy-api .

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Directory.Build.props global.json ./
COPY src/ArnavutkoyBelediyesi.Domain/ArnavutkoyBelediyesi.Domain.csproj src/ArnavutkoyBelediyesi.Domain/
COPY src/ArnavutkoyBelediyesi.Application/ArnavutkoyBelediyesi.Application.csproj src/ArnavutkoyBelediyesi.Application/
COPY src/ArnavutkoyBelediyesi.Persistence/ArnavutkoyBelediyesi.Persistence.csproj src/ArnavutkoyBelediyesi.Persistence/
COPY src/ArnavutkoyBelediyesi.Infrastructure/ArnavutkoyBelediyesi.Infrastructure.csproj src/ArnavutkoyBelediyesi.Infrastructure/
COPY src/ArnavutkoyBelediyesi.Api/ArnavutkoyBelediyesi.Api.csproj src/ArnavutkoyBelediyesi.Api/

RUN dotnet restore src/ArnavutkoyBelediyesi.Api/ArnavutkoyBelediyesi.Api.csproj

COPY src/ src/

RUN dotnet publish src/ArnavutkoyBelediyesi.Api/ArnavutkoyBelediyesi.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Konteyner healthcheck'i için curl; üretim imajında yalnızca bu ek bağımlılık tutulur.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

ENV ASPNETCORE_URLS=http://+:8080 \
    DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_EnableDiagnostics=0

EXPOSE 8080

RUN groupadd --system --gid 10001 appgroup \
    && useradd --system --uid 10001 --gid appgroup --create-home appuser \
    && chown -R appuser:appgroup /app

COPY --from=build --chown=appuser:appgroup /app/publish .

USER appuser

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
    CMD curl -fsS http://127.0.0.1:8080/health || exit 1

ENTRYPOINT ["dotnet", "ArnavutkoyBelediyesi.Api.dll"]
