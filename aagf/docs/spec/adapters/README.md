# adapters

Здесь находятся спецификации адаптеров для разных сред.

- Adapter-спеки MUST определять маппинг из `aagf/docs/spec/**` в производные слои.
- Базовые маппинги adapter-слоя MUST храниться модульно через `aagf/docs/spec/adapters/rules.index.yaml` + `aagf/docs/spec/adapters/rules/*.yaml`.
- Adapter-спеки MUST включать target-проекции как минимум для `jetbrains` и `cursor`.
- Target-проекции MUST описывать генерацию в `aagf/docs/adapters/<target>/**` и runtime-совместимость (`.aiassistant`/`.cursor`).
- Human-проекции target-адаптеров MUST генерироваться в `aagf/docs/human/adapters/<target>/**`.
- Синхронизация в активные runtime-контуры MUST выполняться через `docs:sync` и MAY предваряться `docs:sync:check`.
