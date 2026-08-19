# Arnavutköy Dijital Hizmetler

Kamu dijital hizmet akışlarını modelleyen monorepo: vatandaş portalı, e-belediye modülleri, ulaşım bilgi sistemi ve personel operasyon ekranları.

**Canlı:** [Web arayüzü](https://arnavutkoy-dijital.pages.dev) · [API Swagger](https://arnavutkoy-digital-services-platform.onrender.com/swagger) · [Health](https://arnavutkoy-digital-services-platform.onrender.com/health)

<p align="center">
  <a href="https://arnavutkoy-dijital.pages.dev"><img src="https://img.shields.io/badge/UI-Cloudflare%20Pages-F38020?style=flat-square" alt="UI" /></a>
  <a href="https://arnavutkoy-digital-services-platform.onrender.com/swagger"><img src="https://img.shields.io/badge/API-Swagger-85EA2D?style=flat-square" alt="Swagger" /></a>
  <img src="https://img.shields.io/badge/.NET-8-512BD4?style=flat-square&logo=dotnet" alt=".NET 8" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT" />
</p>

<p align="center">
  <img src="docs/arnavutkoy-showcase.png" alt="Ana sayfa" width="900" />
</p>

> Bağımsız bir yazılım projesidir; resmi belediye kurumunu temsil etmez. Coğrafi, vatandaş ve işlem verileri seed ile oluşturulmuş örnek kayıtlardır.

## Proje hakkında

Belediye dijital kanallarında tekrar eden ihtiyaçları — kimlik doğrulama, başvuru takibi, borç/ödeme, duyuru yönetimi, coğrafi veri, ulaşım bilgisi — tek bir tutarlı sistemde toplamak için geliştirildi. Amaç, katmanları net ayrılmış, test edilebilir ve genişletilebilir bir referans uygulama sunmaktır.

**Roller:** `Citizen` (vatandaş), `Officer` (görevli), `Administrator` (yönetici). Kimlik doğrulama e-posta + parola; oturum JWT access/refresh token çifti ile yönetilir (SPA, `localStorage`).

| Katman | Tercih | Gerekçe |
|---|---|---|
| Backend | ASP.NET Core 8, Clean Architecture, CQRS | İş kurallarını API'den ayırmak; handler/validator testlerini kolaylaştırmak |
| Veri | EF Core 8 + PostgreSQL | Migration tabanlı şema; Identity ile kullanıcı yönetimi |
| API sözleşmesi | MediatR, FluentValidation, ProblemDetails | Tek giriş noktası, tutarlı hata gövdeleri (RFC 7807) |
| Frontend | Vite 7, React 19, TypeScript | Hızlı dev döngüsü; tip güvenliği; sayfa bazlı CSS (framework bağımlılığı yok) |
| Dağıtım | Docker Compose (lokal), Cloudflare Pages + Render (canlı) | UI/API ayrımı; tekrarlanabilir ortam |

Bağımlılık yönü: `Api → Application → Domain`. `Persistence` ve `Infrastructure`, Application arayüzlerini uygular. Ayrıntı: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Canlı ortam ve test hesapları

| Bileşen | URL |
|---|---|
| Web | https://arnavutkoy-dijital.pages.dev |
| Swagger | https://arnavutkoy-digital-services-platform.onrender.com/swagger |
| Health | https://arnavutkoy-digital-services-platform.onrender.com/health |

Render free tier'da API hareketsizlik sonrası uyku moduna geçer; soğuk başlangıç 30–60 saniye sürebilir.

Seed ile oluşturulan hesaplar:

| Rol | E-posta | Parola |
|---|---|---|
| Vatandaş | `vatandas@demo.arnavutkoy.local` | `Demo!Citizen123` |
| Görevli | `gorevli@demo.arnavutkoy.local` | `Demo!Officer123` |
| Yönetici | `yonetici@demo.arnavutkoy.local` | `Demo!Admin123` |

Senaryo adımları: [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md)

## Özellikler

**Vatandaş / e-hizmet** — E-Belediye merkezi, hizmet rehberi, dijital vezne, borç sorgulama/ödeme (emlak, su), belge başvurusu, nikah randevusu, imar sorgusu, spor tesisi randevusu, sosyal yardım, talep/öneri, iletişim formu, hesap yönetimi.

**Ulaşım** — Hat kataloğu, güzergâh/sefer, Leaflet harita, ulaşım kartı ve biniş kaydı.

**Kurumsal içerik** — Haber, duyuru, etkinlik, kültür-sanat, muhtarlık ve birim dizini.

**Personel** — Görevli: talep masası, sosyal yardım, duyuru, borç kesme. Yönetici: coğrafya, hat ve birim yönetimi.

## Mimari

```text
src/
├── ArnavutkoyBelediyesi.Domain
├── ArnavutkoyBelediyesi.Application
├── ArnavutkoyBelediyesi.Persistence
├── ArnavutkoyBelediyesi.Infrastructure
└── ArnavutkoyBelediyesi.Api

tests/          # Domain, Application, Infrastructure, Api.IntegrationTests
web/            # React SPA
docker/         # Dockerfile, Compose
docs/           # Mimari, API, güvenlik, dağıtım
.github/        # CI workflow
```

## Kurulum

**Gereksinimler:** Docker Desktop (Compose v2), Node.js ≥ 20.19 (`web/.nvmrc`: 24.19.0), .NET 8 SDK *(test / konteynersiz geliştirme)*.

### API + PostgreSQL

```bash
cd docker
cp .env.example .env
docker compose up --build -d
```

| Uç nokta | Lokal adres |
|---|---|
| Swagger | http://localhost:8080/swagger |
| Liveness | http://localhost:8080/health |
| Readiness | http://localhost:8080/health/ready |

Migration'lar API ayağa kalkarken uygulanır. `Development` ortamında demo seed arka planda çalışır; `Production`'da kapalıdır (`appsettings.Production.json`).

### Web arayüzü

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

http://localhost:5173 — LAN testi: `http://<makine-ip>:5173`

Yerelde `VITE_API_BASE_URL` **boş** kalmalı; Vite `/api` isteklerini `localhost:8080`'e proxy eder. Production build için HTTPS API adresi zorunludur.

### Testler

```bash
dotnet test ArnavutkoyBelediyesi.slnx
```

Entegrasyon testleri Testcontainers kullanır; Docker Desktop açık olmalıdır.

## Ortam değişkenleri

Lokal Docker (`docker/.env`):

| Değişken | Açıklama |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL parolası (zorunlu) |
| `JWT_SIGNING_KEY` | JWT imza anahtarı, min. 32 karakter |
| `DATABASE_SEED_ON_STARTUP` | Demo seed (`true` / `false`) |
| `API_PORT` | API portu (varsayılan `8080`) |

Web (`web/.env`):

| Değişken | Lokal | Production |
|---|---|---|
| `VITE_API_BASE_URL` | Boş (proxy) | `https://arnavutkoy-digital-services-platform.onrender.com` |

Canlı dağıtım (CORS, Pages build, Render): [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## API

Taban yol: `/api/v1`. Tam sözleşme Swagger'da; özet harita [`docs/API.md`](docs/API.md).

| Grup | Örnek uç noktalar |
|---|---|
| Auth | `POST /auth/register`, `/login`, `/refresh`, `/logout` |
| Talepler | `GET/POST /citizen-requests`, mesaj ve durum geçişleri |
| Borçlar | `GET /debts/mine`, `POST /debts/{id}/payments` |
| Portal | `GET /portal/announcements`, `/portal/events`, `/portal/contents` |
| Coğrafya | `GET /districts`, `/neighborhoods`, `/streets` |

## Ekran görüntüleri

<p align="center">
  <img src="docs/screenshots/01-ana-sayfa.png" alt="Ana sayfa" width="45%" />
  <img src="docs/screenshots/03-e-belediye.png" alt="E-Belediye" width="45%" />
</p>
<p align="center">
  <img src="docs/screenshots/09-panel.png" alt="Vatandaş paneli" width="45%" />
  <img src="docs/screenshots/05-ulasim-agi.png" alt="Ulaşım ağı" width="45%" />
</p>

Diğer ekranlar: [`docs/screenshots/`](docs/screenshots/) (giriş, hatlar, haberler, duyurular, borçlar, iletişim).

## Dokümantasyon

| Belge | İçerik |
|---|---|
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Katmanlar, CQRS, bağımlılık kuralları |
| [`docs/API.md`](docs/API.md) | REST v1 haritası |
| [`docs/SECURITY.md`](docs/SECURITY.md) | Kimlik, token, tehdit modeli |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Docker, Cloudflare Pages, Render |
| [`docs/TESTING.md`](docs/TESTING.md) | Test stratejisi |
| [`docs/PRD.md`](docs/PRD.md) | Ürün kapsamı |
| [`web/README.md`](web/README.md) | Frontend notları |

## Lisans

[MIT](LICENSE) — Copyright © 2026 [ibrahimyagar](https://github.com/ibrahimyagar).
