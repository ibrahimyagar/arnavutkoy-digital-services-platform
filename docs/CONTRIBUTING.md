# Katkı

Bu depo bağımsız bir portföy/demo çalışmasıdır. Yine de dış katkı kabul edilebilir.

## Kurallar

1. Conventional Commits tercih edilir: `feat:`, `fix:`, `test:`, `docs:`, `ci:`.
2. PR açmadan önce: `dotnet build` ve `dotnet test` yeşil olmalı (Docker gerekli).
3. Yeni özellik Clean Architecture sınırlarını bozmamalı: Domain ← Application ← Api/Infra/Persistence.
4. Kullanıcı kimliği istemciden alınmamalı; JWT'den türetilmeli.

## Yerel kurulum

[`DEPLOYMENT.md`](DEPLOYMENT.md) ve kök [`README.md`](../README.md).

## Dokümantasyon

Mimari kararlar `ASSUMPTIONS.md`'ye gerekçesiyle eklenir; büyük değişiklikler `ARCHITECTURE.md`'ye yansıtılır.
