# Главная карта docs-пакета AAGF

Этот файл является нормативным входом переносимого пакета `aagf/docs`.

## Layer model

- `spec/**` MUST быть единственным редактируемым machine-readable source.
- `human/**` MUST быть generated human-проекцией `spec/**`.
- `adapters/**` MUST быть generated adapter-проекцией `spec/**`.
- IF `human/**` или `adapters/**` конфликтует с `spec/**` THEN приоритет MUST быть у `spec/**`.

## Multi-target

- `adapters/jetbrains/**` MUST формировать runtime-пакет для `.aiassistant/**`.
- `adapters/cursor/**` MUST формировать runtime-пакет для `.cursor/**`.
- Alias-модель старого `docs/.aiassistant` MUST NOT использоваться.
- IF runtime adapters (`.aiassistant/**`, `.cursor/**`) уже существуют в целевом проекте THEN они MUST иметь приоритет как операционный источник правил.
- IF runtime adapters отсутствуют THEN агент MUST использовать `aagf/docs/adapters/**`; IF adapters еще не сгенерированы THEN fallback MUST быть `aagf/docs/spec/**`.

## Rule packaging model

- Source-правила в `spec/**` MUST быть модульными: отдельные rule-файлы по назначению и ответственности.
- Каждый rule-модуль MUST иметь стабильный `rule_id`, область применения и явные условия активации.
- Для `human/**` и `adapters/**` MUST генерироваться индекс/карта правил (rule index/map) как навигационный слой.
- Включение/выключение наборов правил MUST управляться через `spec/project/enabled-packs.yaml` и `spec/project/overrides.yaml`.
- Для конкретной IDE runtime-правила MAY собираться в один агрегированный файл, если этого требует target, но source-модульность MUST сохраняться.

## Bootstrap workflow

- Интеграция MUST выполняться по фазам: `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.
- `Install`: пакет `aagf/` MUST быть добавлен в целевой проект; root `AGENTS.md` MUST заменяться шаблоном `aagf/docs/install/AGENTS.md`.
- `Detect`: стек MUST определяться по артефактам целевого репозитория.
- `Generate`: `human/**` и `adapters/**` MUST генерироваться только из `spec/**`.
- `Sync`: runtime-синхронизация MUST выполняться только по явному подтверждению.
- `Lock`: зафиксированный профиль MUST записываться в `spec/project/profile.lock.yaml`.

## Структура пакета

- [AGENTS.md](AGENTS.md)
- [install/AGENTS.md](install/AGENTS.md)
- [spec/README.md](spec/README.md)
- [human/README.md](human/README.md)
- `adapters/jetbrains/**`
- `adapters/cursor/**`
