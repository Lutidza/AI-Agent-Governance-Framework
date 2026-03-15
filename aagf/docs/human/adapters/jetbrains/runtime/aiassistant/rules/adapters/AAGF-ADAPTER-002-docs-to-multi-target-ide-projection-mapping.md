<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/adapters/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/adapters/AAGF-ADAPTER-002-docs-to-multi-target-ide-projection-mapping.md -->

# AAGF-ADAPTER-002 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/adapters/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/adapters/AAGF-ADAPTER-002-docs-to-multi-target-ide-projection-mapping.md`
- Runtime compatibility: `.aiassistant/rules/adapters/AAGF-ADAPTER-002-docs-to-multi-target-ide-projection-mapping.md`
- Human projection path: `runtime/aiassistant/rules/adapters/AAGF-ADAPTER-002-docs-to-multi-target-ide-projection-mapping.md`

## Контекст

- Section: `adapters` / Adapters
- Rule ID: `AAGF-ADAPTER-002`
- Rule title: Docs -> Multi-Target IDE Projection Mapping
- Intent: Формализовать правила построения переносимых adapter-пакетов для JetBrains и Cursor.

## Нормативные правила
- aagf/docs/adapters/jetbrains/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.aiassistant`.
- aagf/docs/adapters/cursor/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.cursor`.
- Multi-target adapter-проекции MUST использовать только переносимые настройки без machine-specific данных.
- Runtime rules/prompts/workflows MUST использовать подтвержденный `aagf/docs/spec/project/stack-context.yaml` как первичный входной контекст.
- Runtime rules/prompts/workflows MUST учитывать `detection.status` и `stack_context_ref` из `context.yaml`/`profile.lock.yaml`.
- Синхронизация в активные runtime-контуры MUST выполняться только через target-aware sync (`docs:sync`) после явного подтверждения пользователя.

## Условия IF -> THEN
- IF Workflow spec содержит prompts THEN Prompt-блок MUST быть включен в prompts-проекции каждого поддерживаемого target.
- IF Adapter-проекция конфликтует с source THEN Source MUST иметь приоритет, а adapter MUST быть перегенерирован.
- IF stack-context отсутствует или имеет статус pending-confirm THEN Runtime-проекция MUST требовать confirm/edit и MUST NOT считать профиль подтвержденным.
- IF Запрошена синхронизация в `/.aiassistant/**` или `/.cursor/**` THEN Агент MUST сначала выполнить `docs:sync:check`, показать изменения и только после подтверждения выполнять `docs:sync`.

## Проверки
- Проверить, что rules/prompts отражают актуальный source для jetbrains и cursor.
- Проверить, что runtime-проекции содержат ссылку на подтвержденный stack-context и confirm/edit требования.
- Проверить отсутствие абсолютных путей и локальных зависимостей.
- Проверить, что runtime-изменения выполнены через sync-процесс, а не ручными правками.
