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

## A9 — Gerçek Coğrafi Veri Kaynağı

Seed verisinde Arnavutköy'ün kamuya açık bazı mahalle adları örnek olarak kullanılmıştır (bu bilgi resmi olmayan, herkese açık coğrafi bilgidir). Muhtar adı/telefonu gibi kişisel alanlar **tamamen kurgusaldır**, gerçek bir kişiyle eşleşmesi amaçlanmamıştır.
