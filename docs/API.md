# API Özeti (v1)

Canlı sözleşme: Swagger UI (`/swagger`) ve OpenAPI JSON (`/swagger/v1/swagger.json`).
Bu sayfa yalnızca keşif için bir haritadır; alan ayrıntıları Swagger XML yorumlarından gelir.

Taban yol: `/api/v1`

## Auth — `/auth`

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| POST | `/register` | Anonim | Vatandaş kaydı |
| POST | `/login` | Anonim | Access + refresh token |
| POST | `/refresh` | Anonim | Token rotation |
| POST | `/logout` | Anonim | Refresh revoke |
| POST | `/change-password` | Bearer | Parola değiştir |

## Citizen Requests — `/citizen-requests`

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/categories` | Anonim | Aktif kategoriler |
| GET | `/` | Officer/Admin | Tüm talepler (sayfalı) |
| GET | `/mine` | Bearer | Kendi talepleri |
| GET | `/{id}` | Bearer + ownership/staff | Detay + mesajlar |
| POST | `/` | Citizen | Talep oluştur |
| POST | `/{id}/messages` | Bearer | Mesaj ekle |
| POST | `/{id}/under-review` | Officer/Admin | İncelemeye al |
| POST | `/{id}/resolve` | Officer/Admin | Çöz |
| POST | `/{id}/close` | Officer/Admin | Kapat |

## Debts — `/debts`

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/mine` | Bearer | Kendi borçları |
| GET | `/{id}` | Bearer + ownership/staff | Borç detayı (faiz hesaplı) |
| POST | `/{id}/payments` | Citizen | Ödeme (kart; CVV persist edilmez) |

## Announcements — `/announcements`

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/` | Anonim | Yayındaki duyurular |
| GET | `/{id}` | Anonim* | Detay (*taslak staff dışı gizlenir) |
| POST | `/` | Officer/Admin | Taslak oluştur |
| PUT | `/{id}` | Officer/Admin | Taslak güncelle |
| POST | `/{id}/publish` | Officer/Admin | Yayınla |
| POST | `/{id}/archive` | Officer/Admin | Arşivle |

## Geography

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/districts` | Anonim | İlçeler |
| POST | `/districts` | Administrator | İlçe ekle |
| GET | `/neighborhoods` | Anonim | Mahalleler (`districtId` opsiyonel) |
| POST | `/neighborhoods` | Administrator | Mahalle ekle |
| GET | `/streets` | Anonim | Sokaklar (`neighborhoodId` opsiyonel) |
| POST | `/streets` | Administrator | Sokak ekle |

## Operasyonel

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/health` | Anonim | Liveness |
| GET | `/health/ready` | Anonim | Readiness (PostgreSQL) |

Demo hesaplar: [`DEPLOYMENT.md`](DEPLOYMENT.md).
