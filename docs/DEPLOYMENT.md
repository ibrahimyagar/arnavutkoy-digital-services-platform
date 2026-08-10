# Dağıtım ve Lokal Çalıştırma

Bu belge, Arnavutköy Belediyesi Örnek Dijital Hizmetler Platformu'nun Docker ile ayağa
kaldırılması, gerekli sırların sağlanması ve sağlık kontrollerinin doğrulanması için
operasyonel bir kılavuzdur.

> ⚠️ Bu proje bağımsız bir portföy/demo çalışmasıdır; resmi bir kurum dağıtımı değildir.

## Önkoşullar

- Docker Desktop (veya Docker Engine + Compose v2)
- (İsteğe bağlı) .NET 8 SDK — yalnızca konteynersiz lokal geliştirme için

## Hızlı Başlangıç (`docker compose up`)

```bash
cd docker
cp .env.example .env
# .env içindeki POSTGRES_PASSWORD ve JWT_SIGNING_KEY değerlerini gözden geçirin
docker compose up --build -d
```

Hazır olduğunda:

| Kaynak | Adres |
|---|---|
| Swagger UI | http://localhost:8080/swagger |
| Health | http://localhost:8080/health |
| Ready (PostgreSQL dahil) | http://localhost:8080/health/ready |

### Demo kullanıcılar (seed)

Seed varsayılan olarak açıktır (`DATABASE_SEED_ON_STARTUP=true`). Kurgusal hesaplar:

| Rol | E-posta | Parola |
|---|---|---|
| Citizen | `vatandas@demo.arnavutkoy.local` | `Demo!Citizen123` |
| Officer | `gorevli@demo.arnavutkoy.local` | `Demo!Officer123` |
| Administrator | `yonetici@demo.arnavutkoy.local` | `Demo!Admin123` |

Portföy için adım adım tur: [`DEMO_WALKTHROUGH.md`](DEMO_WALKTHROUGH.md).

## Ortam Değişkenleri

Sırlar **asla** `appsettings.json` içine yazılmaz. Docker'da `docker/.env` (gitignore'lı)
veya orchestrator secret'ları kullanılır; lokal `dotnet run` için `dotnet user-secrets`.

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `ConnectionStrings__Default` | Evet | PostgreSQL bağlantı dizesi |
| `Jwt__SigningKey` | Evet | En az 32 karakter; eksik/kısa ise uygulama fail-fast ile çöker |
| `Jwt__Issuer` / `Jwt__Audience` | Hayır | Varsayılanlar `appsettings.json`'da |
| `Database__SeedOnStartup` | Hayır | Varsayılan `true`; yalnızca migration isteniyorsa `false` |
| `DISABLE_HTTPS_REDIRECTION` | Docker'da Evet | Konteyner HTTP dinler; TLS ters vekilde sonlanır |
| `Swagger__Enabled` | Hayır | Varsayılan `true` (portföy demosu) |
| `Cors__AllowedOrigins__0` | Production'da | Development dışında whitelist zorunlu |
| `Serilog__Seq__ServerUrl` | Hayır | Doluysa Seq sink açılır (ör. `http://seq:5341`) |

## Konteynersiz Lokal Geliştirme

```bash
# PostgreSQL'in ayakta olduğundan emin olun, ardından:
cd src/ArnavutkoyBelediyesi.Api
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=arnavutkoy;Username=arnavutkoy;Password=..."
dotnet user-secrets set "Jwt:SigningKey" "local-dev-only-signing-key-please-override-32chars-min"
dotnet run
```

Uygulama başlangıcında migration + seed otomatik çalışır (`Database:SeedOnStartup`, varsayılan true).
WebApplicationFactory tabanlı testlerde (`ASPNETCORE_ENVIRONMENT=Testing`) bu adım atlanır.

## CI

GitHub Actions (`.github/workflows/ci.yml`):

1. `dotnet restore` / `build` / `test` (Testcontainers ile gerçek PostgreSQL)
2. Docker imajının başarıyla derlenmesi (`docker/Dockerfile`, push yok)

## Güvenlik Notları

- Compose `.env.example` değerleri **yalnızca lokal demo** içindir; üretimde güçlü rastgele parolalar kullanın.
- JWT imzalama anahtarını rotate ederken mevcut access token'lar geçersizleşir; refresh token'lar
  veritabanında hash'li tutulduğu için anahtar değişimi onları doğrudan etkilemez, ancak yeni
  access token üretimi yeni anahtarla yapılır.
- API konteyneri non-root kullanıcı (`uid 10001`) ile çalışır.
