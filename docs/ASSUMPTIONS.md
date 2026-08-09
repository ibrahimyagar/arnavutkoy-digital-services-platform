# Varsayımlar Kaydı

Bu dosya, proje geliştirme sürecinde durup onay beklemek yerine yapılan makul mühendislik varsayımlarını ve gerekçelerini kayda geçirir. Mimariyi köklü şekilde değiştirecek belirsizlikler ayrıca işaretlenmiştir.

## A1 — Hedef Framework: .NET 8 (LTS)

Talimatta önce .NET 10 belirtilmiş, ardından .NET 8'e güncellenmiştir. Geliştirme ortamında hem .NET 9 hem .NET 10 SDK mevcut olsa da, nihai talimat **.NET 8 LTS** olduğundan tüm `TargetFramework` değerleri `net8.0` olarak sabitlenmiştir. Mimari, framework sürümüne bağlı karar içermediğinden (bkz. proje talimatı Bölüm 2 notu) ileride `net10.0`'a geçiş yalnızca csproj `TargetFramework` değerleri ve paket sürümlerinin güncellenmesiyle mümkün olacaktır.

## A2 — Modül Kapsamı Daraltması (Faz 1)

Referans projede 11 modül/tablo grubu gözlemlenmiştir (bkz. `PRD.md`). Tümünü ilk sürümde eş zamanlı ve **yüzeysel** biçimde uygulamak, Clean Architecture + CQRS + tam test kapsamı hedefiyle çelişir: her modül için Domain kuralı, Application handler'ı, validasyon, entegrasyon testi ve API endpoint'i gerektiği düşünülürse, 11 modülün tümü aynı kalite çubuğunda tek seferde teslim edilemez.

**Karar:** İlk sürümde 5 bounded context **tam derinlikte** (domain kuralları + CQRS + validasyon + testler + API) uygulanır: `Identity`, `Geography`, `Announcements`, `CitizenRequests`, `Payments`. Kalan 5 modül (`SocialAssistance`, `Transportation`, `Properties`, `Hr`, `UtilitySubscriptions`) `PRD.md`'de tasarım seviyesinde envanterlenmiş, ancak kod olarak uygulanmamıştır — mimari bunların "Features/<Modül>" klasörü eklenerek mevcut katmanlara dokunmadan entegre edilmesine izin verir.

Bu, mimariyi kökten değiştirecek bir karar değildir (yeni modül eklemek mevcut yapıyı bozmaz), bu nedenle onay beklenmeden uygulanmıştır. İstenirse ilerleyen bir fazda kalan modüller aynı desenle eklenebilir.

## A3 — Git Kimliği

`git config user.name` / `user.email` global düzeyde zaten `ibrahimyagar` / `yafestahl@gmail.com` olarak ayarlı bulunmuştur; repo-local override veya placeholder gerekmemiştir, mevcut global kimlik kullanılmıştır.

## A4 — API Stili: Controller-based

Minimal API yerine controller-based MVC seçilmiştir; XML doc comment + Swagger + API versiyonlama (`Asp.Versioning`) ile birlikte daha okunaklı, büyüyebilir bir yapı sağlar ve Clean Architecture'da controller'ların "ince" (yalnızca MediatR'a delege eden) katman olması konvansiyonuna daha uygundur.

## A5 — Mapping: Mapster

AutoMapper'ın son sürümlerindeki lisans modeli değişikliği nedeniyle **Mapster** seçilmiştir (ücretsiz, kaynak üretimli, performanslı).

## A6 — Kimlik Doğrulama Alanı

Referans projede T.C. kimlik no / sicil no / telefon ile giriş vardı. Bu projede ASP.NET Core Identity'nin `UserName` alanı **T.C. Kimlik Numarası** olarak kullanılır (11 haneli, TCKN algoritması ile doğrulanır — kurgusal/test amaçlı numaralar seed'de kullanılır, gerçek kişilere ait değildir). E-posta alanı iletişim/parola sıfırlama için tutulur ama giriş yöntemi değildir.

## A7 — Borç Gecikme Faizi Hesaplama Zamanı

Referans projede sayfa her açıldığında borç cezası yeniden hesaplanıp veritabanına yazılıyordu (yan etkili GET). Bu projede ceza, `Debt` entity'sinin salt okunur bir domain metodunda (`CalculateOverdueInterest(DateTime asOfUtc)`) hesaplanır; kalıcı yazma yalnızca ödeme işlemi (`PayDebtCommand`) sırasında, hesaplanan nihai tutarla birlikte gerçekleşir.

## A8 — Redis / Seq Kapsamı

Redis, `IDistributedCache` arkasında soyutlanmış opsiyonel bir bağımlılık olarak `docker-compose.yml`'e eklenmiştir ancak Faz 1'deki 5 modülde henüz aktif bir cache senaryosu (örn. sık okunan `Geography` referans verisi) haricinde yoğun kullanılmamıştır — bu, gerçek düşük trafikli bir belediye API'si için makul bir mühendislik kararıdır (erken optimizasyondan kaçınma).

## A10 — Identity Entity'lerinin Persistence Katmanında Tutulması

Proje talimatında Infrastructure katmanına "Identity implementasyonu", Persistence katmanına ise
"Migrations, Configuration, Seed data" atanmıştı. Ancak `IdentityDbContext<TUser, TRole, TKey>`
jenerik tipi, `ApplicationUser`/`ApplicationRole` sınıflarına derleme zamanında bağımlıdır; bu
sınıfları Infrastructure'da tutmak, Persistence'ın (DbContext'i barındıran) Infrastructure'a
bağımlı olmasını gerektirirdi — bu da zaten kurulmuş olan `Infrastructure → Persistence` referans
yönüyle döngüsel bağımlılık (circular dependency) oluşturur. Bu nedenle:

- `ApplicationUser`, `ApplicationRole`, `RefreshToken` ve `ApplicationDbContext` **Persistence**
  katmanında tutulur (DbContext'e sıkı bağımlı oldukları için).
- **Infrastructure** katmanı yalnızca bu tiplere UserManager/RoleManager üzerinden erişen
  *servisleri* içerir (`IIdentityService`, `IJwtTokenGenerator` implementasyonları, `ICurrentUserService`).

Bu, mimarinin dışarıdan-içeriye bağımlılık yönünü bozmaz; yalnızca "Identity verisi = kalıcılık
detayı" kabulüyle Persistence'ın sorumluluk alanını netleştirir. Yaygın Clean Architecture
şablonlarında (ör. Jason Taylor .NET template) da Identity entity'leri DbContext ile aynı projede
tutulur.

## A9 — Gerçek Coğrafi Veri Kaynağı

Seed verisinde Arnavutköy'ün kamuya açık bazı mahalle adları örnek olarak kullanılmıştır (bu bilgi resmi olmayan, herkese açık coğrafi bilgidir). Muhtar adı/telefonu gibi kişisel alanlar **tamamen kurgusaldır**, gerçek bir kişiyle eşleşmesi amaçlanmamıştır.

## A11 — Faz 5'te Yetkilendirmenin Ertelenmesi ("mine" Uç Noktaları)

Faz 5 kapsamı yalnızca API katmanıdır; kimlik doğrulama/JWT (Faz 6) henüz uygulanmamıştır. Bu nedenle
`GET /citizen-requests/mine` ve `GET /debts/mine` gibi "geçerli kullanıcıya özel" uç noktalar, şu an
için `citizenUserId` / `debtorUserId` değerini bir sorgu parametresi olarak alır. `ICurrentUserService`
arayüzü zaten Application katmanında tanımlıdır ve Faz 6'da JWT claim'lerinden okuyan bir implementasyon
Infrastructure katmanına eklenecek; bu noktada söz konusu uç noktalar sorgu parametresini kaldırıp
`ICurrentUserService.UserId` kullanacak şekilde güncellenecektir. Bu ara durum, Faz 5 sonunda
Swagger üzerinden tüm akışların (kategori listeleme, talep oluşturma, mesajlaşma, borç görüntüleme/ödeme)
uçtan uca test edilebilir olmasını sağlamak için bilinçli bir tercihtir.

## A12 — Swagger'ın Üretim Ortamında Varsayılan Olarak Açık Bırakılması

Bu proje bir portföy/demo çalışması olduğundan, canlıya alınan sürümün de Swagger üzerinden
gösterilebilir olması hedeflenmiştir. Bu nedenle `Swagger:Enabled` yapılandırma anahtarı
varsayılan olarak `true`'dur (yalnızca `appsettings.Development.json` ile sınırlı değildir).
Gerçek bir kurumsal üretim senaryosunda bu anahtarın ortam değişkeniyle `false` yapılması,
ya da IP/temel kimlik doğrulama ile korunması önerilir; bu proje için bilinçli bir görünürlük
tercihi olarak işaretlenmiştir.

## A14 — Faz 6: Ownership Alanlarının İstekten Değil JWT'den Okunması

Faz 5'te "mine" uç noktaları ile bazı komutlar (`CreateCitizenRequestCommand`, `AddRequestMessageCommand`,
`PayDebtCommand`) ilgili kullanıcı kimliğini istek gövdesinden/sorgu parametresinden alıyordu (bkz. A11).
Faz 6'da JWT kimlik doğrulaması eklenince bu alanlar **istekten kaldırılıp** `ICurrentUserService.UserId`
(JWT `NameIdentifier` claim'i) üzerinden okunacak şekilde güncellenmiştir. Böylece:

- Bir vatandaş başka bir vatandaş adına talep oluşturamaz veya borç ödeyemez.
- Bir talep mesajının gönderen türü (`SenderType`), istemcinin beyanına değil, JWT'deki rol claim'ine
  göre sunucu tarafında belirlenir (rol sahteciliği engellenir).

Bu, referans projedeki "istemcinin gönderdiği kullanıcı kimliğine güvenme" sınıfı güvenlik açıklarının
(IDOR — Insecure Direct Object Reference / yetkisiz işlem) bu projedeki karşılığı için alınan önlemdir.

## A15 — Kaynak Sahipliği Denetimi (Ownership Check) Deseni

`GetCitizenRequestByIdQuery` ve `GetDebtByIdQuery`, Application katmanında herhangi bir kimlik
denetimi yapmaz (sorgu, kimin sorduğuna bakılmaksızın kaydı döner). Yetkilendirme, API katmanında
controller seviyesinde uygulanır: sonuç alındıktan sonra, çağıran kullanıcı kaydın sahibi değilse
ve Officer/Administrator rolünde değilse `403 Forbidden` döner. Bu ayrım bilinçlidir: Application
katmanı saf iş kuralı/veri erişimiyle ilgilenir, HTTP'ye özgü yetkilendirme kararları (401/403) API
katmanının sorumluluğundadır. Alternatif olarak sorgu, çağıran kullanıcı kimliğini parametre olarak
alıp filtreleme yapabilirdi; ancak bu, "bulunamadı" ve "yetkisiz" durumlarını ayırt edilemez hâle
getirir ve hata mesajlarının anlamlılığını azaltırdı.

## A16 — Duyuru Taslaklarının Anonim Kullanıcılardan Gizlenmesi

`GET /announcements/{id}` uç noktası anonim erişime açıktır (bir duyurunun kalıcı bağlantısının
paylaşılabilmesi için gereklidir), ancak `GetAnnouncementByIdQuery` artık bir `IncludeUnpublished`
bayrağı alır. Bu bayrak API katmanında yalnızca çağıran kullanıcı Officer/Administrator rolündeyse
`true` gönderilir; aksi hâlde taslak/arşivlenmiş bir duyuru "bulunamadı" olarak döner. Bu, taslak
içeriğin (henüz yayınlanmamış duyuru metinleri) yanlışlıkla dışarı sızmasını önler.

## A17 — Hesap Kilitleme (Lockout) ile Kaba Kuvvet Koruması

ASP.NET Core Identity'nin yerleşik kilitleme mekanizması etkinleştirilmiştir: 5 başarısız giriş
denemesi sonrası hesap 15 dakika kilitlenir (`IdentityOptions.Lockout`). Bu, `/auth/login` uç
noktasındaki IP bazlı hız sınırlamasına (rate limiting) ek bir savunma katmanıdır (defense in depth);
tek bir IP'den değil, dağıtık (distributed) kaba kuvvet denemelerine karşı da koruma sağlar. Referans
projede bu tür bir koruma bulunmuyordu.

## A18 — JWT İmzalama Anahtarının Başlangıçta (Fail-Fast) Doğrulanması

Uygulama, `Jwt:SigningKey` değeri boş veya 256 bitten (32 bayt) kısa ise **başlangıçta çöker**
(`InvalidOperationException`). Bu bilinçli bir tercihtir: zayıf veya eksik bir imzalama anahtarıyla
sessizce ayağa kalkıp çalışma zamanında güvensiz token'lar üretmek, üretimde fark edilmesi güç bir
güvenlik açığına dönüşebilir. Dev ortamında `dotnet user-secrets set "Jwt:SigningKey" "..."`,
prod'da `Jwt__SigningKey` ortam değişkeni ile sağlanmalıdır (bkz. docs/DEPLOYMENT.md — Faz 9'da yazılacak).

## A19 — Seed Verisinin Uygulama Başlangıcında Otomatik Çalıştırılmaması

`ApplicationDbContextSeeder.SeedAsync`, Faz 3'te yazılmış olup roller/demo kullanıcılar/referans
verilerini oluşturur, ancak `Program.cs` içinden henüz çağrılmamaktadır. Bunun bilinçli olarak
Faz 8'e (Docker & CI/CD) bırakılmasının nedeni, `docker-compose up` sonrası "tek komutla çalışan,
seed'lenmiş bir ortam" hedefinin doğal olarak konteyner başlatma/orkestrasyon adımıyla birlikte ele
alınmasıdır; Faz 7'deki entegrasyon testleri ise `SeedAsync`'i kendi Testcontainers fixture'ları
içinde bağımsız olarak çağıracaktır.

## A13 — API Sürüm Stratejisi

`Asp.Versioning` ile URL segment tabanlı sürümleme (`/api/v1/...`) seçilmiştir; header veya query
string tabanlı sürümleme yerine URL segmenti seçilmesinin nedeni, Swagger UI'da sürümler arası
gezinmenin ve dokümantasyonun daha açık/anlaşılır olmasıdır. Şu an tek sürüm (`1.0`) mevcuttur;
gelecekte kırıcı bir değişiklik gerektiğinde yalnızca yeni bir `[ApiVersion("2.0")]` işaretli
controller/aksiyon eklenmesi yeterli olacaktır, mevcut `v1` sözleşmesi bozulmaz.
