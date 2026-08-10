# Mimari

Bu belge, Arnavutköy Belediyesi Örnek Dijital Hizmetler Platformu'nun katman yapısını,
sorumluluk sınırlarını ve referans PHP projesinden bilinçli olarak düzeltilen mimari/güvenlik
derslerini açıklar.

> ⚠️ Bağımsız portföy/demo çalışmasıdır; resmi bir kurum mimarisi değildir.

## 1. Hedefler

1. **Bağımlılık yönü dışarıdan içeriye:** Domain hiçbir altyapıya bağımlı değildir.
2. **İş kuralları Domain'de yaşar:** Durum makineleri, faiz hesabı, kart maskeleme entity metotlarındadır.
3. **API ince kalır:** Controller yalnızca MediatR'a delege eder; HTTP yetkilendirme (401/403) API'dedir.
4. **Test edilebilirlik:** Domain/Application birim testleri; Persistence/API gerçek PostgreSQL
   (Testcontainers) ile entegrasyon testleri.

## 2. Solution Yapısı

```
src/
  ArnavutkoyBelediyesi.Domain          # Entity, value rule, domain event, exception
  ArnavutkoyBelediyesi.Application     # CQRS (MediatR), FluentValidation, Result, arayüzler
  ArnavutkoyBelediyesi.Persistence     # EF Core, Identity store, migration, seed, repository
  ArnavutkoyBelediyesi.Infrastructure  # JWT, CurrentUser, IdentityService, DateTime
  ArnavutkoyBelediyesi.Api             # Controllers, middleware, DI composition, health
tests/
  *.Domain.Tests / *.Application.Tests / *.Infrastructure.Tests / *.Api.IntegrationTests
docker/                                # Dockerfile + compose
docs/                                  # PRD, ASSUMPTIONS, ARCHITECTURE, DEPLOYMENT, ...
```

### Bağımlılık grafiği

```
Api → Application → Domain
Api → Infrastructure → Application
Api → Persistence → Application → Domain
Infrastructure → Persistence   (Identity UserManager/RoleManager erişimi için)
```

`Domain` hiçbir projeye referans vermez. `Application` yalnızca `Domain`'e bağlanır;
kalıcılık ve HTTP detayları arayüzler (`IUnitOfWork`, `IIdentityService`, …) ile soyutlanır.

## 3. Katman Sorumlulukları

| Katman | Sorumluluk | Bilinçli olarak içermez |
|---|---|---|
| **Domain** | Aggregate root'lar, invariant'lar, domain event'ler, TCKN doğrulama | EF, HTTP, DI, JWT |
| **Application** | Command/Query handler, validator, Result, pipeline behavior | DbContext, Controller |
| **Persistence** | `ApplicationDbContext`, Fluent API config, migration, soft-delete/audit interceptor, seed | İş kuralı, HTTP |
| **Infrastructure** | JWT üretimi, Identity adaptörü, `ICurrentUserService` | Domain kuralı |
| **Api** | Routing, authZ, ProblemDetails, rate limit, CORS, health, startup seed çağrısı | İş kuralı |

### Identity entity yerleşimi

`ApplicationUser` / `ApplicationRole` / `RefreshToken` **Persistence** içindedir
(`IdentityDbContext` ile derleme zamanı bağı). Infrastructure yalnızca bu tipleri
`UserManager`/`RoleManager` üzerinden kullanan servisleri barındırır. Gerekçe: döngüsel
bağımlılığı önlemek (bkz. `ASSUMPTIONS.md` → A10).

## 4. CQRS + MediatR

Her özellik `Application/Features/<Context>/` altında toplanır:

- `Commands/` — yazma (yan etkili)
- `Queries/` — okuma (yan etkisiz)
- `Dtos/` — API'ye çıkan projeksiyonlar

Pipeline davranışları:

1. **ValidationBehavior** — FluentValidation hatalarını `Result`/`Result<T>` failure'a çevirir
   (exception fırlatmaz; tutarlı HTTP 400).
2. **UnhandledExceptionLoggingBehavior** — beklenmeyen hataları loglar; istemciye sızdırmaz
   (global middleware ile birlikte).

Controller'lar `HandleResult` ile Result → HTTP (200/201/204/400 ProblemDetails) dönüşümü yapar.

## 5. Bounded Context'ler (Faz 1)

| Context | Aggregate / kavram | Önemli domain kuralları |
|---|---|---|
| Identity | Kullanıcı, rol, refresh token | TCKN checksum; refresh token hash + rotasyon; lockout |
| Geography | District → Neighborhood → Street | Salt okunur referans; yazma yalnızca Administrator |
| Announcements | Announcement | Draft → Published → Archived; taslak anonime kapalı |
| CitizenRequests | CitizenRequest + RequestMessage | Pending → UnderReview → Resolved/Closed; Closed'a mesaj yok |
| Payments | Debt + Payment | Gecikme faizi salt okunur hesap; ödeme idempotent; kart maskeli |
| Properties | CitizenProperty | Mahalle/sokak bağlama; sahip JWT; pasife alma |

Yol haritası kalanı (`UtilitySubscriptions`, `Hr`, `SocialAssistance`, `Transportation`) `PRD.md`'de;
mimari `Features/<Yeni>` eklenerek genişlemeye uygundur.

## 6. Kalıcılık Desenleri

- **Repository + Unit of Work:** Yazma yolları tracked entity + `SaveChangesAsync`.
- **Soft delete:** `AuditableEntity.IsDeleted` + global query filter; sert silme interceptor'da soft'a çevrilir.
- **Audit:** `CreatedAtUtc` / `UpdatedAtUtc` / `CreatedBy` / `UpdatedBy` interceptor ile doldurulur.
- **Domain event dispatch:** `SaveChanges` sonrası MediatR `IPublisher` ile yayınlanır.
- **N+1 önleme:** `CitizenRequestRepository.GetByIdWithMessagesAsync` → `Include(Messages)`.
- **Client-generated Guid + çocuk entity:** Yeni `RequestMessage` kayıtları EF tarafından yanlışlıkla
  `Modified` işaretlenmesin diye `CitizenRequestRepository.Update` bunları `Added` yapar
  (bkz. Faz 7'de yakalanan concurrency bug).

## 7. Kimlik ve Yetkilendirme

```
Register/Login → Access JWT (kısa ömür) + Refresh token (DB'de SHA-256 hash)
Refresh → eski token revoke + yeni çift (rotation; replay engeli)
```

Roller: `Citizen`, `Officer`, `Administrator`.

- Ownership alanları (**userId**, borç sahibi, talep sahibi) **istekten değil JWT'den** okunur.
- Kaynak detay sorgularında sahiplik kontrolü controller'da yapılır (sahip değilse ve staff değilse 403).
- `AuthController`'da `[AllowAnonymous]` metot seviyesindedir; `change-password` `[Authorize]` gerektirir.

Detaylı tehdit modeli: [`SECURITY.md`](SECURITY.md).

## 8. Hata ve Gözlemlenebilirlik

- Beklenen iş hataları → `Result.Failure` → HTTP 400 ProblemDetails (detay mesajı güvenli, iş kuralı düzeyinde).
- Beklenmeyen hatalar → `ExceptionHandlingMiddleware` → HTTP 500 genel mesaj; stack yalnızca logda.
- Health: `/health`, `/health/ready` (PostgreSQL).

## 9. Test Stratejisi

Özet tablo ve çalıştırma: [`TESTING.md`](TESTING.md).

| Katman | Araç | Ne doğrular |
|---|---|---|
| Domain | xUnit + FluentAssertions | Invariant, durum geçişi, TCKN, kart maskeleme |
| Application | xUnit + NSubstitute | Handler/validator, ValidationBehavior |
| Infrastructure | Testcontainers PostgreSQL | Repository, interceptor, soft-delete |
| API | WebApplicationFactory + Testcontainers | Auth, RBAC, uçtan uca yaşam döngüleri |

## 10. Referans Projeden Öğrenilen Dersler

Referans PHP e-belediye projesinde gözlemlenen anti-pattern'ler ve bu projedeki karşılıkları:

| # | Referans sorun | Bu projedeki çözüm |
|---|---|---|
| 1 | SQL string birleştirme / injection riski | EF Core parametrik LINQ; raw SQL yok |
| 2 | Şifre değişikliğinde eski şifre kontrolü zayıf/yok | Identity `ChangePassword` + mevcut parola zorunlu |
| 3 | "Beni hatırla" düz metin/base64 cookie | Refresh token hash + rotation + süre |
| 4 | Path traversal / güvensiz include | Controller routing; dosya include yok |
| 5 | `mysqli_error()` istemciye sızması | ProblemDetails + güvenli genel 500 |
| 6 | Talep+mesaj N+1 | `Include` / projeksiyon |
| 7 | GET sırasında yan etkili ceza `UPDATE` | Salt okunur domain hesabı; yazma yalnız ödemede |
| 8 | Tutarsız validasyon | FluentValidation tüm giriş noktalarında |
| 9 | Hardcoded sırlar | user-secrets / env; JWT fail-fast |
| 10 | Admin paneli yok / IDOR riski | Rol + ownership; kullanıcı kimliği JWT'den |
| 11 | Manuel/tarayıcı-only test | 200+ otomatik test (birim + entegrasyon) |

## 11. Bilinçli Ertelemeler

- **Serilog:** Konsol (+ isteğe bağlı Seq via `Serilog:Seq:ServerUrl`). Request logging
  `/health` gürültüsünü Debug'a düşürür; hassas alanlar şablona alınmaz.
- **Redis:** Kullanılmayan bağımlılık eklenmedi (`ASSUMPTIONS` A8).
- **Payment gateway:** Demo kart doğrulama; gerçek PCI kapsamı yok — kart tam numarası/CVV asla persist edilmez.

## 12. İlgili Belgeler

- Ürün kapsamı: [`PRD.md`](PRD.md)
- Mühendislik varsayımları: [`ASSUMPTIONS.md`](ASSUMPTIONS.md)
- Güvenlik: [`SECURITY.md`](SECURITY.md)
- Test: [`TESTING.md`](TESTING.md)
- Dağıtım: [`DEPLOYMENT.md`](DEPLOYMENT.md)
