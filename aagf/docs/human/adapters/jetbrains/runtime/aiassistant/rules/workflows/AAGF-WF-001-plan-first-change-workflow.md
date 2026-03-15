<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/workflows/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-001-plan-first-change-workflow.md -->

# AAGF-WF-001 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/workflows/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-001-plan-first-change-workflow.md`
- Runtime compatibility: `.aiassistant/rules/workflows/AAGF-WF-001-plan-first-change-workflow.md`
- Human projection path: `runtime/aiassistant/rules/workflows/AAGF-WF-001-plan-first-change-workflow.md`

## Контекст

- Section: `workflows` / Workflows
- Rule ID: `AAGF-WF-001`
- Rule title: Plan-First Change Workflow
- Intent: Любое нетривиальное изменение должно проходить анализ, план и контролируемое выполнение.

## Нормативные правила
- Для нетривиальной задачи агент MUST выполнить этапы analyze -> plan -> implement -> verify.
- Этап implement MUST NOT начинаться до фиксации плана.
- Handoff MUST содержать измененные файлы, риски и проверки.

## Условия IF -> THEN
- IF Задача затрагивает архитектуру или несколько подсистем THEN Агент MUST использовать reasoning-intensive профиль и детальный план.
- IF На этапе verify обнаружен regression risk THEN Агент MUST остановить продвижение и предложить корректирующий план.

## Проверки
- Проверить наличие плана перед код-изменениями.
- Проверить полноту handoff и верификации.
