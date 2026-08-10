# Vatandaş Web Arayüzü

Vite + React + TypeScript vatandaş paneli. API'ye JWT ile bağlanır.

## Çalıştırma

1. API ayakta olsun (`docker compose up` veya lokal API, genelde `http://localhost:8080`).
2. Bu klasörde:

```bash
npm install
npm run dev
```

Tarayıcı: `http://localhost:5173`

Vite, `/api` isteklerini `localhost:8080`'e proxy eder. Doğrudan API adresi için `.env`:

```
VITE_API_BASE_URL=http://localhost:8080
```

## Demo giriş

- TCKN: `10000000146`
- Şifre: `Demo!Citizen123`

## Bu fazda olanlar

- Marka odaklı ana sayfa
- Giriş / çıkış + refresh token
- Panel, borçlar (ödeme), talepler listesi, ulaşım kartı, duyurular, hatlar

## Bilinçli sınırlar

- Talep oluşturma formu sonraki faz
- Personel/admin paneli yok
- Resmi belediye bağlantısı yoktur (portföy demosu)
