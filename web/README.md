# Vatandaş Web Arayüzü

Vite + React + TypeScript portal. API'ye JWT ile bağlanır.

## Çalıştırma

1. API ayakta olsun (`docker compose up` veya lokal API, genelde `http://localhost:8080`).
2. Bu klasörde:

```bash
npm install
npm run dev
```

Tarayıcı: `http://localhost:5173` — `npm run dev` ağı da dinler; telefondan `http://<PC-LAN-IP>:5173`.

Node.js **20.19+** (veya 22.12+ / 24 LTS) önerilir; Vite 7 bunu bekler. `web/.nvmrc` dosyası `24.19.0` işaret eder.

Vite, `/api` isteklerini `localhost:8080`'e proxy eder. Yerelde `VITE_API_BASE_URL` boş kalsın; aksi halde telefon API'yi kendi localhost'una ister. Üretim için HTTPS adres:

```
VITE_API_BASE_URL=https://arnavutkoy-digital-services-platform.onrender.com
```

## Demo giriş (e-posta)

- Vatandaş: `vatandas@demo.arnavutkoy.local` / `Demo!Citizen123`
- Görevli: `gorevli@demo.arnavutkoy.local` / `Demo!Officer123`
- Yönetici: `yonetici@demo.arnavutkoy.local` / `Demo!Admin123`

Adım adım senaryolar: [`../docs/DEMO_WALKTHROUGH.md`](../docs/DEMO_WALKTHROUGH.md).

## Özellikler

**Herkese açık:** ana sayfa + sidebar, duyurular, otobüs hatları, muhtarlıklar, birim/personel dizini, kayıt

**Vatandaş:** panel, dijital vezne, borç ödeme (kart formu), talepler + yazışma, ulaşım kartı, biniş simülasyonu, mülk, su, sosyal yardım, hesap ayarları

**Görevli:** talep/sosyal yardım masası, duyuru yönetimi, su/emlak borç kesme

**Yönetici:** coğrafya, hat yönetimi, birim yönetimi (+ görevli yetkileri)
