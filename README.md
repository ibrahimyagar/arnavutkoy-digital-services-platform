# Arnavutköy Belediyesi Örnek Dijital Hizmetler Platformu

> ⚠️ **Bu proje bağımsız bir portföy/demo çalışmasıdır, herhangi bir resmi belediye kurumunu temsil etmez ve onunla bağlantılı değildir.**
> Tüm veriler (mahalle isimleri hariç kamuya açık coğrafi bilgiler) kurgusaldır; gerçek vatandaşlara ait hiçbir kişisel veri içermez.

## Proje Hakkında

Bu depo, açık kaynak bir e-belediye referans projesinden çıkarılan modül envanterini (bkz. [`docs/PRD.md`](docs/PRD.md)) temel alarak, .NET/PostgreSQL ekosisteminde **sıfırdan** tasarlanmış örnek bir dijital belediye hizmetleri platformudur. Amaç; Clean Architecture, CQRS, güvenli kimlik doğrulama ve test edilebilirlik prensiplerini uçtan uca uygulayan bir portföy projesi ortaya koymaktır.

## Mimari ve Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Runtime | .NET 8 (LTS) |
| API | ASP.NET Core Web API (controller-based) |
| ORM | Entity Framework Core 8 + Npgsql |
| Veritabanı | PostgreSQL 16+ |
| Mimari | Clean Architecture + CQRS (MediatR) |
| Validasyon | FluentValidation |
| Kimlik Doğrulama | ASP.NET Core Identity + JWT (access + refresh token) |
| API Dokümantasyonu | Swagger / OpenAPI |
| Test | xUnit, FluentAssertions, Testcontainers |
| Konteynerizasyon | Docker + docker-compose |
| CI/CD | GitHub Actions |

Geliştirme süreci boyunca alınan mühendislik kararları: [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md).  
Dağıtım / Docker kılavuzu: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Proje Durumu

- [x] Faz 0 — Keşif ve modül envanteri
- [x] Faz 1 — Solution iskeleti ve katman yapısı
- [x] Faz 2 — Domain katmanı
- [x] Faz 3 — Persistence katmanı ve migration'lar
- [x] Faz 4 — Application katmanı (CQRS)
- [x] Faz 5 — API katmanı
- [x] Faz 6 — Kimlik doğrulama ve güvenlik
- [x] Faz 7 — Test kapsamı
- [x] Faz 8 — Docker ve CI/CD
- [ ] Faz 9 — Kapsamlı dokümantasyon
- [ ] Faz 10 — Son kontrol

## Docker ile Çalıştırma (önerilen)

```bash
cd docker
cp .env.example .env
docker compose up --build -d
```

- Swagger: http://localhost:8080/swagger  
- Health: http://localhost:8080/health  

Demo hesaplar ve ortam değişkenleri için [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Konteynersiz Lokal Geliştirme

```bash
dotnet restore
dotnet build
dotnet run --project src/ArnavutkoyBelediyesi.Api
```

JWT imzalama anahtarı ve bağlantı dizesi için `dotnet user-secrets` kullanın (bkz. DEPLOYMENT.md).

## Testler

```bash
dotnet test ArnavutkoyBelediyesi.slnx
```

Infrastructure ve API entegrasyon testleri Docker gerektirir (Testcontainers → PostgreSQL 16).

## Lisans

Bu proje bir portföy/demo çalışmasıdır; lisans dosyası dokümantasyon fazında eklenecektir.
