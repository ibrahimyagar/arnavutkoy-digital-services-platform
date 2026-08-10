# Ürün Gereksinim Dokümanı (PRD)

## 1. Amaç ve Kapsam

Bu doküman, incelenen açık kaynak bir PHP tabanlı e-belediye referans projesinden çıkarılan modül envanterini ve bu envanterin **Arnavutköy Belediyesi Örnek Dijital Hizmetler Platformu** (bağımsız, resmi olmayan portföy projesi) içindeki karşılıklarını tanımlar.

Referans alınan projenin mimarisi, veri modeli ve iş kuralları birebir kopyalanmamıştır; aşağıdaki envanter sadece **kavramsal** bir başlangıç noktasıdır. Bu platformdaki tüm entity'ler, ilişkiler, doğrulama kuralları ve iş akışları .NET/PostgreSQL ekosistemine uygun şekilde yeniden tasarlanmıştır.

## 2. Referans Projede Gözlemlenen Modül Envanteri

| # | Referans Modül | Özet |
|---|---|---|
| 1 | Üyelik / Kimlik Doğrulama | T.C. kimlik no, sicil no veya telefon ile kayıt/giriş |
| 2 | Dinamik Modül Sistemi | Veritabanı üzerinden menü öğeleri/modüller tanımlama |
| 3 | Sosyal Yardım Başvurusu | Dinamik form alanlarıyla yardım başvurusu, değerlendirme durumu |
| 4 | Dijital Vezne — Ulaşım Kartı Bakiye Yükleme | Kredi kartı ile ulaşım kartına bakiye yükleme |
| 5 | Dijital Vezne — Borç Ödeme | Su/emlak/diğer borçların üyelikli veya üyeliksiz ödenmesi, gecikme faizi |
| 6 | Hizmet Masası | Vatandaş talebi oluşturma, belediye ile mesajlaşma, durum takibi |
| 7 | Mülkler | Vatandaşa bağlı mahalle/sokak bazlı mülk kayıtları |
| 8 | Belediye Personelleri / Departmanlar | Departman bazlı personel listesi, iletişim |
| 9 | Ulaşım Ağı | Hat, güzergah, hareket saatleri, tarife, kart tipi, biniş simülasyonu |
| 10 | Muhtarlıklar | Mahalle, nüfus, muhtar iletişim bilgisi |
| 11 | Su Aboneliği | Abonelik kaydı, borç ile ilişkilendirme |

## 3. Bu Projedeki Karşılıklar ve Kapsam Kararı

Kalite ve mimari tutarlılığı ödünlemeden, ilk sürümde **derinlemesine ve eksiksiz** şekilde uygulanacak modüller ile **yol haritasına bırakılan** modüller ayrıştırılmıştır. Gerekçe: `ASSUMPTIONS.md` → *Kapsam Daraltma* kararına bakınız. Mimari (Clean Architecture + CQRS) yeni bir modülün, mevcut katmanlara dokunmadan yalnızca yeni bir "Features/<Modül>" klasörü eklenerek entegre edilmesine izin verir; bu nedenle kapsam dışı bırakılan modüller ileride teknik borç oluşturmadan eklenebilir.

### 3.1. Faz 1 Kapsamı (bu sürümde tam uygulanır)

| Referans Modül | Bu Projedeki Karşılığı | Bounded Context |
|---|---|---|
| Üyelik / Kimlik Doğrulama | Vatandaş + Belediye Personeli hesapları, rol bazlı yetkilendirme (Citizen, Officer, Administrator) | `Identity` |
| Dinamik Modül Sistemi + Muhtarlıklar (coğrafi referans verisi) | İlçe → Mahalle → Sokak hiyerarşisi, Muhtar bilgisi | `Geography` |
| — (yeni, kurumsal iletişim ihtiyacı) | Duyuru (Announcement) yönetimi | `Announcements` |
| Hizmet Masası | Vatandaş Talebi (CitizenRequest) + Talep Mesajı (RequestMessage), durum makinesi | `CitizenRequests` |
| Dijital Vezne — Borç Ödeme | Borç (Debt) + Ödeme (Payment), gecikme faizi hesaplama domain kuralı | `Payments` |

### 3.2. Yol Haritası (sırayla tamamlanıyor)

| Referans Modül | Bounded Context | Durum |
|---|---|---|
| Sokak (Geography genişlemesi) | `Geography` / Street | ✅ R1 |
| Mülkler | `Properties` | ✅ R2 |
| Su Aboneliği | `UtilitySubscriptions` | ✅ R3 |
| Belediye Personelleri / Departmanlar | `Hr` | ✅ R4 |
| Sosyal Yardım Başvurusu | `SocialAssistance` | ✅ R5 |
| Dijital Vezne — Ulaşım Kartı | `Transportation` | R6 |

## 4. Faz 1 Kapsamındaki Modüllerin Detaylı Gereksinimleri

### 4.1. Identity
- Vatandaş kendi T.C. kimlik numarası (11 hane, algoritmik doğrulama) ve telefon numarasıyla kayıt olur.
- Roller: `Citizen`, `Officer`, `Administrator`.
- JWT access token (kısa ömürlü) + refresh token (rotasyonlu, veritabanında saklanan hash).
- Şifre asla düz metin veya özel algoritmayla saklanmaz; ASP.NET Core Identity'nin `PasswordHasher`'ı kullanılır.

### 4.2. Geography
- `District` (İlçe) → `Neighborhood` (Mahalle) → `Street` (Sokak) hiyerarşisi.
- Her mahallenin muhtar adı, telefonu ve nüfusu tutulur.
- Salt okunur referans veri; sadece `Administrator` rolü değişiklik yapabilir.
- Anonim `GET` ile listelenir; oluşturma `Administrator` yetkisi ister.

### 4.3. Announcements
- Belediye tarafından yayınlanan duyurular; başlık, içerik, yayın tarihi, geçerlilik bitiş tarihi, yayında/taslak durumu.
- Vatandaşlar sadece yayınlanmış ve süresi geçmemiş duyuruları görebilir.

### 4.4. CitizenRequests (Hizmet Masası)
- Vatandaş bir talep kategorisi seçip mesajıyla talep oluşturur.
- Talep durumu: `Pending` → `UnderReview` → `Resolved` / `Closed` (domain'de durum geçiş kuralları uygulanır, örn. `Closed` talebe mesaj eklenemez).
- Talebe ait mesajlaşma geçmişi (`RequestMessage`) hem vatandaş hem görevli tarafından eklenebilir.
- Bir vatandaş yalnızca kendi taleplerini görebilir; `Officer`/`Administrator` tüm talepleri görebilir.

### 4.5. Payments (Borç & Ödeme)
- Borç türleri: su, emlak, diğer (genişletilebilir enum).
- Vade tarihi geçen borçlara belediye faiz oranı üzerinden günlük gecikme faizi otomatik hesaplanır (**domain kuralı**, referans projedeki gibi sayfa render sırasında yan etkili `UPDATE` yerine, ödeme anında veya sorgu anında **yan etkisiz** hesaplanır — bkz. `ARCHITECTURE.md` → *Referans Projeden Öğrenilen Dersler*).
- Ödeme, borcu `Paid` durumuna geçirir ve bir `Payment` kaydı oluşturur (idempotent — aynı borç iki kez ödenemez).

### 4.6. Properties (Mülkler)
- Vatandaş, mahalle ve isteğe bağlı sokak bağlayarak kendi mülkünü kaydeder (`OwnerUserId` JWT'den).
- Türler: konut, ticari, arsa. Ada/parsel ve kapı no tutulur (tapu entegrasyonu yok; demo veri).
- Sahip kendi mülklerini listeler/günceller/pasife alır; personel tümünü okuyabilir.

### 4.7. UtilitySubscriptions (Su Aboneliği)
- Vatandaş mahalle (+ opsiyonel mülk) ile abonelik açar; abone numarası benzersizdir.
- Durum: Active → Suspended ↔ Active → Closed. Yalnızca Active iken personel `DebtType.Water` borcu üretebilir.
- Ödeme mevcut `/debts` akışıyla yapılır.

### 4.8. Hr (Personel / Departman Dizini)
- Halka açık departman ve personel listesi; Identity login hesaplarından ayrıdır.
- Anonim okuma; yazma yalnızca Administrator.

### 4.9. SocialAssistance
- Sabit alanlar (tür, hane, gelir, özet) + isteğe bağlı JSON esnek alan.
- Durum: Submitted → UnderReview → Approved/Rejected; vatandaş Submitted/UnderReview iken çekebilir.

## 5. Referans Projeden Öğrenilen ve Bilinçli Olarak Düzeltilen Noktalar

> Detaylı güvenlik/mimari analiz için bkz. `ARCHITECTURE.md` → "Referans Projeden Öğrenilen Dersler" bölümü. Özet:

1. **SQL Injection** → EF Core parametrik LINQ sorguları, hiçbir yerde raw SQL string concatenation yok.
2. **CSRF + şifre değişikliğinde eski şifre kontrolü yoksu** → şifre değişikliği eski şifre doğrulaması gerektirir; JWT tabanlı API'de CSRF riski cookie tabanlı oturumlara göre zaten düşüktür, ayrıca `SameSite`/`HttpOnly` uygulanır.
3. **"Beni hatırla" şifreyi düz metin/base64 cookie'de saklıyordu** → refresh token, veritabanında yalnızca hash'i tutulan, rotasyonlu, süreli bir token'dır; şifre hiçbir zaman cookie/localStorage'a yazılmaz.
4. **Path traversal / whitelist'siz include** → API'de dosya include kavramı yok (controller/endpoint routing), bu sınıf açık yapısal olarak imkânsız.
5. **Ham `mysqli_error()` istemciye sızdırılıyordu** → global exception middleware, `ProblemDetails` ile yalnızca güvenli, genel hata mesajı döner; teknik detay yalnızca Serilog sunucu loglarına yazılır.
6. **N+1 query riski** (ör. talepler + mesajlar ayrı ayrı sorgulanıyordu) → EF Core `Include`/projeksiyon sorguları ile tek sorguda getirilir.
7. **Sayfa render sırasında yan etkili `UPDATE` (borç cezası)** → ceza hesaplama salt okunur bir domain hesaplama fonksiyonuna taşındı, kalıcı yazma yalnızca ödeme anında yapılır.
8. **Validasyon eksikliği / tutarsız escaping** → tüm giriş noktaları FluentValidation ile doğrulanır, tek bir tutarlı strateji.
9. **Hardcoded config / sırların koda gömülmesi** → connection string ve JWT anahtarı `appsettings.json`'da asla düz metin değil; `dotnet user-secrets` (dev) / ortam değişkenleri (prod).
10. **Admin paneli yok, her şey doğrudan veritabanından** → `Administrator` rolü için CQRS command'ları üzerinden yönetilen API endpoint'leri (Faz 1'de Geography ve Announcements için).

## 6. Yasal / Etik Not

Bu proje, gerçek Arnavutköy Belediyesi ile hiçbir resmi bağlantısı olmayan, bağımsız bir portföy/demo çalışmasıdır. Kullanılan tüm vatandaş, personel ve işlem verileri kurgusaldır. Coğrafi referans veriler (ilçe/mahalle adları gibi kamuya açık bilgiler) haricinde gerçek kişisel veri kullanılmamıştır.
