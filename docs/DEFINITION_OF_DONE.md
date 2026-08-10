# Definition of Done — Faz 10 Son Kontrol

Bu kontrol listesi, proje talimatındaki tamamlanma kriterlerine göre Faz 10'da
doğrulanmıştır. Tarih: 2026-08-10.

## Kalite kapıları

| Kriter | Sonuç |
|---|---|
| `dotnet build` — 0 uyarı / 0 hata | ✅ |
| `dotnet test` — tüm testler yeşil | ✅ 282 (102 Domain + 91 Application + 26 Infrastructure + 63 API) |
| Commit geçmişinde AI/araç adı yok | ✅ |
| `.env` / sır dosyaları commit'te yok | ✅ |
| Resmi kurum bağlantısı olmadığına dair uyarı (README + docs) | ✅ |
| MIT lisans mevcut | ✅ |

## Çalışır demo

| Kriter | Sonuç |
|---|---|
| `docker compose up --build` ile API + PostgreSQL | ✅ (healthy) |
| `/health`, `/health/ready` | ✅ 200 |
| Swagger `/swagger/v1/swagger.json` | ✅ 200 |
| Anonim uçlar (announcements, districts, categories) | ✅ 200 |
| Demo vatandaş login + `/debts/mine` | ✅ 200 |
| Kimliksiz `/debts/mine` | ✅ 401 |

## Mimari / güvenlik

| Kriter | Sonuç |
|---|---|
| Clean Architecture katman sınırları | ✅ `ARCHITECTURE.md` |
| CQRS + FluentValidation + Result | ✅ |
| JWT + refresh rotation + ownership | ✅ `SECURITY.md` |
| Kart tam numarası/CVV persist edilmez | ✅ |
| ProblemDetails; teknik hata sızdırılmaz | ✅ |
| Seed idempotent; Testing'de atlanır | ✅ |

## Dokümantasyon

| Belge | Durum |
|---|---|
| PRD, ASSUMPTIONS, ARCHITECTURE, SECURITY, TESTING, API, DEPLOYMENT, CONTRIBUTING | ✅ |
| README indeks + hızlı başlangıç | ✅ |
| CI workflow (`.github/workflows/ci.yml`) | ✅ |

## Faz 10'da yapılan cilalar

1. Kullanılmayan **Mapster** paketleri kaldırıldı; ASSUMPTIONS A5 güncellendi.
2. `Microsoft.Extensions.DependencyInjection.Abstractions` **10.x → 8.0.2** pin (net8.0 hizası).
3. PRD: `Street` R1 ile uygulandı; Serilog iddiası `ILogger` olarak düzeltildi.

## Bilinçli kapsam dışı (dürüst borç)

- Redis — ihtiyaç doğunca (`ASSUMPTIONS` A8)
- Coverlet zorunlu yüzde eşiği — CI rapor üretir, eşik yok (`TESTING.md`)
- Gerçek ödeme PSP entegrasyonu — demo kart doğrulama

## Yol haritası (R1–R6)

- ~~R1 Street (Geography)~~ — tamamlandı
- ~~R2 Properties~~ — tamamlandı
- ~~R3 UtilitySubscriptions~~ — tamamlandı
- ~~R4 Hr~~ — tamamlandı
- ~~R5 SocialAssistance~~ — tamamlandı
- ~~R6 Transportation~~ — tamamlandı

## Sonraki sertleştirme (Faz 11+)

- Serilog konsol + opsiyonel Seq (`Serilog:Seq:ServerUrl`) — uygulandı
- CI Coverlet Cobertura artifact — uygulandı
