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

## Bootstrap workflow

- Интеграция MUST выполняться по фазам: `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.
- `Install`: пакет `aagf/` MUST быть добавлен в целевой проект; root `AGENTS.md` MUST применяться только через merge.
- `Detect`: стек MUST определяться по артефактам целевого репозитория.
- `Generate`: `human/**` и `adapters/**` MUST генерироваться только из `spec/**`.
- `Sync`: runtime-синхронизация MUST выполняться только по явному подтверждению.
- `Lock`: зафиксированный профиль MUST записываться в `spec/project/profile.lock.yaml`.

## Структура пакета

- [AGENTS.md](AGENTS.md)
- [spec/README.md](spec/README.md)
- [human/README.md](human/README.md)
- `adapters/jetbrains/**`
- `adapters/cursor/**`
