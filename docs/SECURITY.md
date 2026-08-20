# Güvenlik

Bu belge, platformun tehdit modelini ve alınan kontrolleri özetler. Amaç; referans PHP
projesindeki bilinen zafiyet sınıflarının bu kod tabanında nasıl kapatıldığını şeffaf
göstermektir.

> Portföy/demo projesidir. Gerçek kişisel veri işlemez; üretim sertleştirmesi için ek
> adımlar (WAF, secret manager, TLS sonlandırma, pen-test) gerekir.

## 1. Güvenlik Hedefleri

1. Kimlik bilgileri ve oturum jetonları güvenli saklanır / iletilir.
2. Yetkisiz kaynak erişimi (IDOR) engellenir.
3. Kart verisi PCI kapsamını daraltacak şekilde işlenir (tam PAN/CVV persist edilmez).
4. Hata mesajları bilgi sızdırmaz.
5. Kaba kuvvet ve replay saldırılarına karşı savunma katmanları vardır.

## 2. Kimlik Doğrulama

| Kontrol | Uygulama |
|---|---|
| Parola hash | ASP.NET Core Identity `PasswordHasher` (özel algoritma yok) |
| Giriş kimliği | E-posta (`Email`/`UserName`); TCKN profil alanı |
| E-posta doğrulama | Kayıt sonrası 6 haneli kod (RNG); **SHA-256 hash** DB'de; 10 dk TTL; max 5 deneme; resend cooldown 60 sn |
| Doğrulanmamış giriş | `EMAIL_NOT_CONFIRMED` — genel "şifre hatalı" mesajından ayrı |
| Access token | Kısa ömürlü JWT (varsayılan 15 dk) |
| Refresh token | Rastgele; **yalnızca SHA-256 hash** DB'de; rotation; revoke |
| Replay | Kullanılmış refresh token yeniden kullanılamaz |
| Lockout | 5 başarısız deneme → 15 dk kilit |
| Rate limit | `/auth/*` uçlarında IP bazlı (Testing ortamında kapalı); verify/resend dahil |
| JWT anahtarı | ≥ 256 bit; eksik/kısa ise **fail-fast** startup crash |
| Sırlar | `appsettings.json`'da boş; user-secrets / env (`Smtp:*`, `Jwt:*`) |
| SMTP | `Host`+`FromAddress` doluysa MailKit; aksi halde `LoggingEmailSender` |
| Enumeration | Resend: hesap yok/var aynı başarı yanıtı |

## 3. Yetkilendirme

| Kaynak | Kural |
|---|---|
| Kendi borçları / talepleri | JWT `sub` = kaynak sahibi |
| Başkasının borcu/talebi | Citizen → 403; Officer/Administrator → okuma/işlem (role göre) |
| Duyuru yazma | Officer veya Administrator |
| Coğrafya yazma | Yalnızca Administrator |
| Duyuru taslağı | Anonim/Citizen → "bulunamadı"; staff → görünür |

**Kritik kural:** `citizenUserId` / `payerUserId` istemciden kabul edilmez; sunucu JWT'den üretir.

`AuthController` sınıf seviyesinde `[AllowAnonymous]` **yoktur** (aksi hâlde `change-password`
üzerindeki `[Authorize]` etkisiz kalırdı — Faz 7'de yakalanıp düzeltildi).

## 4. Ödeme / Kart Verisi

- İstek gövdesinde kart numarası + CVV doğrulanır.
- Persist edilen: `MaskedCardNumber` (ilk 4 + son 4), kart sahibi adı, tutar, zaman.
- CVV ve tam kart numarası loglanmaz ve DB'ye yazılmaz.
- Aynı borç iki kez ödenemez (`DebtAlreadyPaidException` → 400).

Bu, gerçek bir ödeme ağ geçidi değildir; demo amaçlıdır. Üretimde PSP (ödeme servis sağlayıcısı)
tokenizasyonu kullanılmalıdır.

## 5. Girdi Doğrulama ve Çıktı

- Tüm command/query girişleri FluentValidation.
- Global exception middleware: teknik detay istemciye gitmez.
- Soft-delete: "silinen" kayıtlar varsayılan sorgulardan düşer.

## 6. Konteyner / Dağıtım

- API imajı non-root (`uid 10001`).
- Compose `.env` gitignore'lı; `.env.example` yalnızca demo değerleri içerir.
- Konteyner HTTP dinler; TLS ters vekilde sonlandırılmalıdır (`DISABLE_HTTPS_REDIRECTION`).

## 7. Bilinen Sınırlar (dürüst kapsam)

- CSRF: Bearer token API modelinde klasik cookie-CSRF riski düşüktür; cookie tabanlı SPA eklenirse
  SameSite/antiforgery ayrıca tasarlanmalıdır.
- Dağıtık rate limit: tek instance bellek içi limiter; yatay ölçekte Redis-backed limiter gerekir.
- Swagger varsayılan açık (portföy görünürlüğü); kurumsal prod'da kapatılmalı veya korunmalı.
- Merkezi log: Serilog konsola yazar; Seq opsiyonel (`Serilog:Seq:ServerUrl`). Redis-backed
  dağıtık rate limit yatay ölçekte ayrıca gerekir.

## 8. İlgili Kod Noktaları

- JWT setup: `Api/Configuration/AuthenticationExtensions.cs`
- Ownership: `Api/Controllers/V1/*Controller.cs` (`IsOwnerOrStaff`)
- Refresh rotation: `Application/Features/Auth/Commands`
- E-posta doğrulama: `Domain/Identity/EmailVerificationCode.cs`, `Application/Features/Auth/*`
- SMTP: `Infrastructure/Services/SmtpEmailSender.cs` / `LoggingEmailSender.cs`
- Kart maskeleme: `Domain/Payments/Payment.cs`
- Exception middleware: `Api/Middleware/ExceptionHandlingMiddleware.cs`
