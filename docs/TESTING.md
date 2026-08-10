# Test Stratejisi

## Çalıştırma

```bash
# Tüm testler (Infrastructure + API için Docker Desktop gerekir)
dotnet test ArnavutkoyBelediyesi.slnx

# Yalnızca birim testleri
dotnet test tests/ArnavutkoyBelediyesi.Domain.Tests
dotnet test tests/ArnavutkoyBelediyesi.Application.Tests
```

CI: `.github/workflows/ci.yml` — `ubuntu-latest` üzerinde restore → build → test → Docker image build.

## Katmanlar

| Proje | Tür | Bağımlılık | Odak |
|---|---|---|---|
| `Domain.Tests` | Birim | Yok | Entity invariant, TCKN, durum geçişleri |
| `Application.Tests` | Birim | NSubstitute | Handler, validator, ValidationBehavior |
| `Infrastructure.Tests` | Entegrasyon | Testcontainers PostgreSQL 16 | Repository, audit/soft-delete, domain event, AddMessage kalıcılığı |
| `Api.IntegrationTests` | Uçtan uca | WebApplicationFactory + Testcontainers | Auth, RBAC, talep/borç/duyuru yaşam döngüsü |

Yaklaşık **264** test (R1–R6 yol haritası sonrası: 102 Domain + 91 Application + 26 Infrastructure + 45 API).

## API Entegrasyon Testleri

- Ortam: `ASPNETCORE_ENVIRONMENT=Testing`
- Rate limiting kapalı (tek IP'den yoğun istek sahte 429 üretmesin)
- Startup seed atlanır; `ApiFactory` kendi container'ında migrate + seed yapar
- JWT ve connection string ortam değişkenleriyle (fail-fast sırası için) verilir

Demo kullanıcı sabitleri: `ApiFactory.DemoUsers` (seed ile aynı TCKN/parola).

## Testlerin Yakaladığı Üretim Bug'ları

Faz 7 sırasında otomatik testler şu gerçek hataları ortaya çıkardı (düzeltildi):

1. Sınıf seviyesinde `[AllowAnonymous]` → `change-password` 500 yerine artık 401.
2. Client-generated Guid çocuk entity → EF `Modified` sanıyordu; `RequestMessage` artık `Added`.
3. Testing'de rate limiter → entegrasyon paketini bozuyordu; Testing'de kapalı.

Bu, "manuel tarayıcı testi yeter" yaklaşımına karşı bilinçli bir karşı-örnektir.

## Kapsam Notu

CI, Coverlet ile Cobertura raporu üretir (`coverage/` artifact). Zorunlu yüzde eşiği
yoktur; birincil kalite kapısı anlamlı senaryo kapsamı ve yeşil test suite'tir.
Yerel rapor:

```bash
dotnet test ArnavutkoyBelediyesi.slnx -c Release --collect:"XPlat Code Coverage" --results-directory ./coverage
```
