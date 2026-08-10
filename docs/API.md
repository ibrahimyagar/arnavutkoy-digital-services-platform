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

## Properties

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/properties/mine` | Authenticated | Kendi mülklerim |
| GET | `/properties` | Officer/Administrator | Tüm mülkler (filtre: `ownerUserId`, `neighborhoodId`) |
| GET | `/properties/{id}` | Sahip veya personel | Mülk detayı |
| POST | `/properties` | Citizen | Mülk kaydı |
| PUT | `/properties/{id}/address` | Sahip veya Administrator | Adres güncelle |
| POST | `/properties/{id}/deactivate` | Sahip veya Administrator | Pasife al |

## UtilitySubscriptions

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/water-subscriptions/mine` | Authenticated | Kendi aboneliklerim |
| GET | `/water-subscriptions` | Officer/Administrator | Tüm abonelikler |
| GET | `/water-subscriptions/{id}` | Abone veya personel | Abonelik detayı |
| POST | `/water-subscriptions` | Citizen | Abonelik aç |
| POST | `/water-subscriptions/{id}/suspend` | Officer/Administrator | Askıya al |
| POST | `/water-subscriptions/{id}/reactivate` | Officer/Administrator | Yeniden aktif et |
| POST | `/water-subscriptions/{id}/close` | Officer/Administrator | Kapat |
| POST | `/water-subscriptions/{id}/debts` | Officer/Administrator | Su borcu oluştur |

## Hr

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/departments` | Anonim | Departmanlar |
| POST | `/departments` | Administrator | Departman ekle |
| GET | `/staff` | Anonim | Personel (`departmentId` opsiyonel) |
| POST | `/staff` | Administrator | Personel ekle |

## SocialAssistance

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/social-assistance/mine` | Authenticated | Kendi başvurularım |
| GET | `/social-assistance` | Officer/Administrator | Tüm başvurular |
| GET | `/social-assistance/{id}` | Başvuran veya personel | Detay |
| POST | `/social-assistance` | Citizen | Başvuru gönder |
| POST | `/social-assistance/{id}/start-review` | Officer/Administrator | İncelemeye al |
| POST | `/social-assistance/{id}/decide` | Officer/Administrator | Onayla/reddet |
| POST | `/social-assistance/{id}/withdraw` | Citizen (sahip) | Geri çek |

## Transportation

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/bus-lines` | Anonim | Hatlar |
| GET | `/bus-lines/{id}` | Anonim | Hat detayı (durak + hareket saatleri) |
| POST | `/bus-lines` | Administrator | Hat ekle |
| POST | `/bus-lines/{id}/stops` | Administrator | Durak ekle |
| POST | `/bus-lines/{id}/departures` | Administrator | Hareket saati ekle |
| GET | `/transport-cards/mine` | Authenticated | Kartlarım |
| GET | `/transport-cards/mine/boardings` | Authenticated | Binişlerim |
| GET | `/transport-cards/{id}` | Sahip veya personel | Kart detayı |
| POST | `/transport-cards` | Citizen | Kart çıkar |
| POST | `/transport-cards/{id}/top-up` | Citizen (sahip) | Bakiye yükle |
| POST | `/transport-cards/{id}/board` | Citizen (sahip) | Biniş simülasyonu |

## Operasyonel

| Metot | Yol | Auth | Açıklama |
|---|---|---|---|
| GET | `/health` | Anonim | Liveness |
| GET | `/health/ready` | Anonim | Readiness (PostgreSQL) |

Demo hesaplar: [`DEPLOYMENT.md`](DEPLOYMENT.md).
