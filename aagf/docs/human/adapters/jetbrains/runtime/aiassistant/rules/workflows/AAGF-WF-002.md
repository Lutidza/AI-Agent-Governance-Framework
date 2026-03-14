<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/workflows/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-002.md -->

# AAGF-WF-002 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/workflows/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-002.md`
- Runtime compatibility: `.aiassistant/rules/workflows/AAGF-WF-002.md`
- Human projection path: `runtime/aiassistant/rules/workflows/AAGF-WF-002.md`

## Контекст

- Section: `workflows` / Workflows
- Rule ID: `AAGF-WF-002`
- Rule title: Spec-Driven Documentation Workflow
- Intent: Любое изменение документации должно проходить через aagf/docs/spec с обязательной синхронизацией производных слоев.

## Нормативные правила
- Нормативные изменения MUST вноситься сначала в aagf/docs/spec/**.
- После изменений MUST выполняться docs:generate и docs:check.
- Drift между source и derived слоями MUST NOT оставаться в репозитории.

## Условия IF -> THEN
- IF Изменение внесено только в generated файл THEN Агент MUST перенести изменение в соответствующий spec-файл и перегенерировать слой.
- IF docs:check возвращает drift THEN Изменение MUST считаться незавершенным до устранения drift.

## Проверки
- Проверить успех команд docs:validate, docs:generate, docs:check.
- Проверить, что generated файлы соответствуют обновленному source.
