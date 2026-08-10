# Katkı

Bu depo bağımsız bir portföy/demo çalışmasıdır. Yine de dış katkı kabul edilebilir.

## Kurallar

1. **AI/araç adı commit mesajına yazılmaz** (`Co-authored-by: Cursor` vb. yok).
2. Conventional Commits tercih edilir: `feat:`, `fix:`, `test:`, `docs:`, `ci:`.
3. PR açmadan önce: `dotnet build` ve `dotnet test` yeşil olmalı (Docker gerekli).
4. Yeni özellik Clean Architecture sınırlarını bozmamalı: Domain ← Application ← Api/Infra/Persistence.
5. Kullanıcı kimliği istemciden alınmamalı; JWT'den türetilmeli.

## Yerel kurulum

[`DEPLOYMENT.md`](DEPLOYMENT.md) ve kök [`README.md`](../README.md).

## Dokümantasyon

Mimari kararlar `ASSUMPTIONS.md`'ye gerekçesiyle eklenir; büyük değişiklikler `ARCHITECTURE.md`'ye yansıtılır.
