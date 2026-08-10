# Demo senaryosu (portföy walkthrough)

Bağımsız demo; gerçek belediye ile bağlantısı yoktur. Aşağıdaki akışlar `docker compose` + `web` ile uçtan uca gösterilebilir.

## Önkoşul

1. API: `cd docker && docker compose up --build -d` → http://localhost:8080
2. UI: `cd web && npm install && npm run dev` → http://localhost:5173
3. Node **20.19+** (önerilen: 24 LTS; `web/.nvmrc`).

## Demo hesaplar

| Rol | E-posta | Şifre |
|---|---|---|
| Vatandaş | `vatandas@demo.arnavutkoy.local` | `Demo!Citizen123` |
| Görevli | `gorevli@demo.arnavutkoy.local` | `Demo!Officer123` |
| Yönetici | `yonetici@demo.arnavutkoy.local` | `Demo!Admin123` |

## 5 dakikalık tur

### 1) Giriş yapmadan

- `/` — modül ızgarası (üyeliksiz + kilitli üyelikli) + güncel duyurular + sol sidebar
- `/duyurular` — liste + arama → `/duyurular/:id` detay
- `/hatlar` / `/ulasim-agi` — hat listesi + ulaşım hub (tablo)
- `/muhtarliklar` — nüfus sıralı tablo, harf filtresi, telefon
- `/birimler` — halka açık birim/personel dizini
- `/kayit` — e-posta ile vatandaş kaydı (doğum/cinsiyet dahil)

### 2) Vatandaş döngüsü

Giriş: vatandaş hesabı → `/panel` (canlı özet: açık borç / talep / kart bakiyesi + sidebar)

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Vezne | `/vezne` | Canlı borç/bakiye özeti + kısayollar |
| Borç gör / öde | `/borclar` | Durum/tür filtresi, vade uyarısı, kart ödeme |
| Talep aç | `/talepler` | İki sütun: form + tablo (referans hizmet masası) |
| Yazışma | `/talepler/:id` | Vatandaş mesajı / personelde şablon + “yanıtla ve çöz” |
| Ulaşım | `/ulasim` | Kart önerisi, yükleme tutarı, hat arama, son binişler |
| Biniş sim. | `/binis` | Hat arama, bakiye kontrolü, onay özeti |
| Mülk | `/mulkler` | Mahalle arama + sokak + özet sayaçları |
| Su | `/su` | Abone önerisi + mülk bağlama |
| Sosyal yardım | `/yardim` | Tür şablonu, durum filtresi, kişi başı gelir |
| Ayarlar | `/ayarlar` | Profil, telefon, parola |

### 3) Görevli döngüsü

Çıkış → görevli girişi → `/panel` (canlı kuyruk: açık talep · yardım · taslak duyuru)

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Talep masası | `/personel` veya `/talepler` | Sekmeler, arama, durum sayaçları, hızlı aksiyon |
| Sosyal yardım | `/personel` | Onay/red kuyruğu + filtre |
| Duyuru | `/duyuru-yonetimi` | Şablon, arama, durum sayaçları, yayın penceresi ipucu |
| Su borcu | `/su-yonetimi` | Arama, durum sayaçları, hazır tutar, askı/kapat |
| Emlak borcu | `/mulk-yonetimi` | Arama, tür/mahalle filtresi, hazır emlak tutarı |
| Birimler (public) | `/birimler` | Arama + birim kartları |

Öneri: vatandaşla talep aç → görevliyle yanıtla/çöz → vatandaşla zaman çizelgesini göster.
Borç için: vatandaş su/mülk kaydı → görevli borç kes → vatandaş `/borclar` ile öde.

### 4) Yönetici döngüsü

Yönetici girişi:

| Adım | Sayfa | Ne gösterilir |
|---|---|---|
| Coğrafya | `/cografya` | Sekmeler, arama, nüfus özeti, mahalle/sokak şablonları |
| Hatlar | `/hat-yonetimi` | Hat şablonu+durak, arama, sefer gün grupları |
| Birimler | `/birim-yonetimi` | Birim kartları, arama, personel şablonları |
| (+ görevli yetkileri) | personel / duyuru / su / mülk | Aynı operasyonel masalar |

## Bilinçli sınırlar (demo)

- Ödeme gerçek tahsilat değildir.
- HR dizini Identity hesaplarıyla bağlı değildir.
- Coğrafya düzenleme/silme yok (liste + oluşturma).
- Emlak/su borçları mülk veya abonelik üzerinden kesilir; genel “serbest borç” UI’sı yoktur.
- Seed vatandaş hesabında hazır kart (`AK-34-1001`), mülk, su aboneliği ve örnek borçlar vardır (temiz DB’de).

## Daha fazla

- API uçları: [`API.md`](API.md)
- Mimari: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Dağıtım: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Web özeti: [`../web/README.md`](../web/README.md)
