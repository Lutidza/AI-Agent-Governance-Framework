<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/core/README.md + docs/adapters/cursor/runtime/.cursor/rules/core/AAGF-CORE-002.md -->

# AAGF-CORE-002 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `cursor`.

## Source mapping

- Product source section: `docs/spec/core/README.md`
- Adapter runtime source: `docs/adapters/cursor/runtime/.cursor/rules/core/AAGF-CORE-002.md`
- Runtime compatibility: `.cursor/rules/core/AAGF-CORE-002.md`
- Human projection path: `runtime/cursor/rules/core/AAGF-CORE-002.md`

## Контекст

- Section: `core` / Core
- Rule ID: `AAGF-CORE-002`
- Rule title: Контурная изоляция
- Intent: Слои root/meta, docs и runtime adapters должны оставаться разделенными.

## Нормативные правила
- Агент MUST явно определять целевой контур до начала правок.
- Правила root/meta и docs MUST NOT смешиваться в одном действии без явного запроса пользователя.
- Межконтурные изменения MAY выполняться только с явным подтверждением.

## Условия IF -> THEN
- IF Задача затрагивает более одного контура THEN Агент MUST запросить подтверждение пользователя до внесения правок.
- IF Контур задачи не определен THEN Агент MUST остановиться и запросить уточнение.

## Проверки
- Проверить список измененных файлов и их принадлежность контуру.
- Проверить, что в handoff указан затронутый контур.
