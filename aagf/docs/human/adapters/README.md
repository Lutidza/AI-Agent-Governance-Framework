<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/adapters/README.md -->

# adapters

Маппинг source-слоя в средовые и runtime-представления.

## Источник

- Spec-source: [`docs/spec/adapters/README.md`](../../spec/adapters/README.md)
- Spec-data: [`docs/spec/adapters/mappings.yaml`](../../spec/adapters/mappings.yaml)

## Операционные записи
### AAGF-ADAPTER-001 - Docs -> Human Projection Mapping

Назначение: Формализовать правила преобразования spec-содержимого в человеко-читаемые документы.

Правила:
- Генератор MUST строить aagf/docs/human/** из YAML-спеков и manifest-конфигурации.
- Генератор MUST строить aagf/docs/human/adapters/<target>/** как человеко-читаемую проекцию target-runtime adapter-слоя.
- Каждый generated документ MUST содержать ссылку на source.
- Human-проекция MUST NOT добавлять нормативные правила, отсутствующие в source.

IF -> THEN:
- IF В human-слое обнаружен новый нормативный пункт без source THEN Пункт MUST быть удален или перенесен в source.
- IF Source-файл переименован THEN Generator mapping MUST быть обновлен в manifest до следующей генерации.

Проверки:
- Проверить валидность manifest и section specs.
- Проверить корректность ссылок source -> derived.
- Проверить наличие human-проекций для каждого target из manifest.
### AAGF-ADAPTER-002 - Docs -> Multi-Target IDE Projection Mapping

Назначение: Формализовать правила построения переносимых adapter-пакетов для JetBrains и Cursor.

Правила:
- aagf/docs/adapters/jetbrains/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.aiassistant`.
- aagf/docs/adapters/cursor/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.cursor`.
- Multi-target adapter-проекции MUST использовать только переносимые настройки без machine-specific данных.
- Runtime rules/prompts/workflows MUST использовать подтвержденный `aagf/docs/spec/project/stack-context.yaml` как первичный входной контекст.
- Runtime rules/prompts/workflows MUST учитывать `detection.status` и `stack_context_ref` из `context.yaml`/`profile.lock.yaml`.
- Синхронизация в активные runtime-контуры MUST выполняться только через target-aware sync (`docs:sync`) после явного подтверждения пользователя.

IF -> THEN:
- IF Workflow spec содержит prompts THEN Prompt-блок MUST быть включен в prompts-проекции каждого поддерживаемого target.
- IF Adapter-проекция конфликтует с source THEN Source MUST иметь приоритет, а adapter MUST быть перегенерирован.
- IF stack-context отсутствует или имеет статус pending-confirm THEN Runtime-проекция MUST требовать confirm/edit и MUST NOT считать профиль подтвержденным.
- IF Запрошена синхронизация в `/.aiassistant/**` или `/.cursor/**` THEN Агент MUST сначала выполнить `docs:sync:check`, показать изменения и только после подтверждения выполнять `docs:sync`.

Проверки:
- Проверить, что rules/prompts отражают актуальный source для jetbrains и cursor.
- Проверить, что runtime-проекции содержат ссылку на подтвержденный stack-context и confirm/edit требования.
- Проверить отсутствие абсолютных путей и локальных зависимостей.
- Проверить, что runtime-изменения выполнены через sync-процесс, а не ручными правками.

## Target Human Projections
- [jetbrains/README.md](jetbrains/README.md)
- [jetbrains/runtime/aiassistant/rules/README.md](jetbrains/runtime/aiassistant/rules/README.md)
- [jetbrains/runtime/aiassistant/prompts/README.md](jetbrains/runtime/aiassistant/prompts/README.md)
- [cursor/README.md](cursor/README.md)
- [cursor/runtime/cursor/rules/README.md](cursor/runtime/cursor/rules/README.md)
- [cursor/runtime/cursor/prompts/README.md](cursor/runtime/cursor/prompts/README.md)

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
