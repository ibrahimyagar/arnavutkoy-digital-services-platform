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

- Vatandaş: `10000000146` / `Demo!Citizen123`
- Görevli: `10000000252` / `Demo!Officer123`
- Yönetici: `10000000368` / `Demo!Admin123`

## Bu fazda olanlar

- Marka odaklı ana sayfa
- Giriş / çıkış + refresh token
- Panel, borçlar (ödeme), talepler (oluşturma + detay/mesaj), ulaşım kartı
- Duyurular, hat listesi + hat detayı (durak/saat)
- Mülk, su aboneliği, sosyal yardım
- Personel masası (talep durumu + sosyal yardım onay/red)
- Yönetici coğrafya ekranı (ilçe / mahalle / sokak)
- Talep UX: durum zaman çizelgesi, Türkçe durumlar, yazışma görünümü, durum filtreleri
- Mülkte sokak seçimi; su aboneliğinde isteğe bağlı mülk bağlama

## Bilinçli sınırlar

- Coğrafya düzenleme/silme yok (yalnızca liste + oluşturma)
- Resmi belediye bağlantısı yoktur (portföy demosu)
