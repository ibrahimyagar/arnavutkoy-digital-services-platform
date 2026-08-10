# Demo senaryosu (portföy walkthrough)

Bağımsız demo; gerçek belediye ile bağlantısı yoktur. Aşağıdaki akışlar `docker compose` + `web` ile uçtan uca gösterilebilir.

## Önkoşul

1. API: `cd docker && docker compose up --build -d` → http://localhost:8080
2. UI: `cd web && npm install && npm run dev` → http://localhost:5173
3. Node **20.19+** önerilir (`web/.nvmrc`).

## Demo hesaplar

| Rol | TCKN | Şifre |
|---|---|---|
| Vatandaş | `10000000146` | `Demo!Citizen123` |
| Görevli | `10000000252` | `Demo!Officer123` |
| Yönetici | `10000000368` | `Demo!Admin123` |

## 5 dakikalık tur

### 1) Giriş yapmadan

- `/` — marka ana sayfa
- `/duyurular` — yayındaki duyurular
- `/hatlar` → hat detayı (durak/saat)
- `/birimler` — halka açık birim/personel dizini

### 2) Vatandaş döngüsü

Giriş: vatandaş hesabı → `/panel`

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Borç gör / öde | `/borclar` | Seed borç + demo kart ödeme |
| Talep aç | `/talepler` | Kategori + mesaj → durum zaman çizelgesi |
| Yazışma | `/talepler/:id` | Vatandaş mesajı |
| Ulaşım | `/ulasim` | Kart, bakiye, biniş |
| Mülk | `/mulkler` | Mahalle + isteğe bağlı sokak |
| Su | `/su` | Abonelik (+ isteğe bağlı mülk bağlama) |
| Sosyal yardım | `/yardim` | Başvuru / geri çekme |

### 3) Görevli döngüsü

Çıkış → görevli girişi → `/panel`

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Talep masası | `/personel` veya `/talepler` | İncele / çöz / kapat + yazışma |
| Sosyal yardım | `/personel` | İnceleme / onay / red |
| Duyuru | `/duyuru-yonetimi` | Taslak → yayın → arşiv |
| Su borcu | `/su-yonetimi` | Aktif aboneliğe borç kes |
| Emlak borcu | `/mulk-yonetimi` | Aktif mülke borç kes |

Öneri: vatandaşla talep aç → görevliyle yanıtla/çöz → vatandaşla zaman çizelgesini göster.
Borç için: vatandaş su/mülk kaydı → görevli borç kes → vatandaş `/borclar` ile öde.

### 4) Yönetici döngüsü

Yönetici girişi:

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Coğrafya | `/cografya` | İlçe → mahalle → sokak oluştur |
| Birimler | `/birim-yonetimi` | Departman + dizin personeli |
| (+ görevli yetkileri) | personel / duyuru / su / mülk | Aynı operasyonel masalar |

## Bilinçli sınırlar (demo)

- Ödeme gerçek tahsilat değildir.
- HR dizini Identity hesaplarıyla bağlı değildir.
- Coğrafya düzenleme/silme yok (liste + oluşturma).
- Emlak/su borçları mülk veya abonelik üzerinden kesilir; genel “serbest borç” UI’sı yoktur.

## Daha fazla

- API uçları: [`API.md`](API.md)
- Mimari: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Dağıtım: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Web özeti: [`../web/README.md`](../web/README.md)
