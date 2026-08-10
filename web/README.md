# Vatandaş Web Arayüzü

Vite + React + TypeScript portal. API'ye JWT ile bağlanır.

## Çalıştırma

1. API ayakta olsun (`docker compose up` veya lokal API, genelde `http://localhost:8080`).
2. Bu klasörde:

```bash
npm install
npm run dev
```

Tarayıcı: `http://localhost:5173`

Node.js **20.19+** (veya 22.12+) önerilir; Vite 7 bunu bekler. `web/.nvmrc` dosyası `20.19.0` işaret eder.

Vite, `/api` isteklerini `localhost:8080`'e proxy eder. Doğrudan API adresi için `.env`:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Demo giriş

- Vatandaş: `10000000146` / `Demo!Citizen123`
- Görevli: `10000000252` / `Demo!Officer123`
- Yönetici: `10000000368` / `Demo!Admin123`

Adım adım senaryolar: [`../docs/DEMO_WALKTHROUGH.md`](../docs/DEMO_WALKTHROUGH.md).

## Özellikler

**Herkese açık:** ana sayfa, duyurular, otobüs hatları, birim/personel dizini

**Vatandaş:** panel, borç ödeme, talepler + yazışma, ulaşım kartı, mülk, su, sosyal yardım

**Görevli:** talep/sosyal yardım masası, duyuru yönetimi, su borç kesme, emlak borç kesme

**Yönetici:** coğrafya (ilçe/mahalle/sokak), birim yönetimi (+ görevli yetkileri)

## Bilinçli sınırlar

- Coğrafya düzenleme/silme yok (yalnızca liste + oluşturma)
- HR dizini Identity hesaplarıyla bağlı değildir
- Resmi belediye bağlantısı yoktur (portföy demosu)
