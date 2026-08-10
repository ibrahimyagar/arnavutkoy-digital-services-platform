# Arnavutköy Belediyesi Örnek Dijital Hizmetler Platformu

> ⚠️ **Bu proje bağımsız bir portföy/demo çalışmasıdır; herhangi bir resmi belediye kurumunu temsil etmez ve onunla bağlantılı değildir.**
> Tüm vatandaş/personel/işlem verileri kurgusaldır. Kamuya açık coğrafi adlar (ör. mahalle isimleri) dışında gerçek kişisel veri kullanılmamıştır.

## Neden bu proje?

Açık kaynak bir PHP e-belediye referansındaki modül envanterini temel alıp, aynı kavramları
**.NET 8 + PostgreSQL** üzerinde Clean Architecture + CQRS ile **sıfırdan** yeniden tasarlar.
Amaç satır satır port değil; SQL injection, IDOR, düz metin oturum, N+1 ve yan etkili GET gibi
sorunları bilinçli olarak düzelten, test edilebilir bir örnek ortaya koymaktır.

## Teknoloji

| Alan | Seçim |
|---|---|
| Runtime | .NET 8 (LTS) |
| API | ASP.NET Core Web API + Swagger |
| Veri | EF Core 8 + PostgreSQL 16 |
| Mimari | Clean Architecture + CQRS (MediatR) |
| Validasyon | FluentValidation |
| Kimlik | ASP.NET Core Identity + JWT (access + refresh rotation) |
| Test | xUnit, FluentAssertions, NSubstitute, Testcontainers |
| Ops | Docker Compose, GitHub Actions |

## Hızlı başlangıç

```bash
cd docker
cp .env.example .env
docker compose up --build -d
```

| | |
|---|---|
| Swagger | http://localhost:8080/swagger |
| Health | http://localhost:8080/health |

Demo kullanıcılar ve ortam değişkenleri → [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

```bash
dotnet test ArnavutkoyBelediyesi.slnx   # Docker Desktop gerekir (Testcontainers)
```

## Dokümantasyon

| Belge | İçerik |
|---|---|
| [`docs/PRD.md`](docs/PRD.md) | Ürün kapsamı ve modül envanteri |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Katmanlar, CQRS, referans dersleri |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Tehdit modeli ve kontroller |
| [`docs/TESTING.md`](docs/TESTING.md) | Test stratejisi |
| [`docs/API.md`](docs/API.md) | v1 uç nokta haritası |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker / sırlar / demo hesaplar |
| [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) | Mühendislik varsayımları |
| [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md) | Faz 10 doğrulama kaydı |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) | Katkı kuralları |

## Proje durumu

- [x] Faz 0–8 — Keşif → domain → application → persistence → API → güvenlik → test → Docker/CI
- [x] Faz 9 — Kapsamlı dokümantasyon
- [x] Faz 10 — Son kontrol (Definition of Done)

DoD doğrulama kaydı: [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md).

## Çözüm yapısı (özet)

```
src/Domain | Application | Persistence | Infrastructure | Api
tests/*.(Domain|Application|Infrastructure|Api.Integration)Tests
docker/   docs/   .github/workflows/
```

Ayrıntı: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Lisans

[MIT](LICENSE) — Copyright (c) 2026 ibrahimyagar.
