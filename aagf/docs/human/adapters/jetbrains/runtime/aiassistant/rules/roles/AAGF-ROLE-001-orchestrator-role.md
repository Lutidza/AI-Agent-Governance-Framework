<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/roles/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/roles/AAGF-ROLE-001-orchestrator-role.md -->

# AAGF-ROLE-001 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/roles/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/roles/AAGF-ROLE-001-orchestrator-role.md`
- Runtime compatibility: `.aiassistant/rules/roles/AAGF-ROLE-001-orchestrator-role.md`
- Human projection path: `runtime/aiassistant/rules/roles/AAGF-ROLE-001-orchestrator-role.md`

## Контекст

- Section: `roles` / Roles
- Rule ID: `AAGF-ROLE-001`
- Rule title: Orchestrator (Дирижер)
- Intent: Управляет задачей, распределяет шаги между ролями и принимает итоговый handoff.

## Нормативные правила
- Orchestrator MUST определять рабочий контур и целевой workflow до старта исполнения.
- Orchestrator MUST назначать bounded scope для каждой подроли.
- Orchestrator MUST NOT делегировать критические решения без финальной верификации.

## Условия IF -> THEN
- IF В задаче участвуют несколько ролей THEN Orchestrator MUST выпустить явный handoff protocol для каждой роли.
- IF Обнаружен конфликт между результатами ролей THEN Orchestrator MUST остановить merge и инициировать reconciliation шаг.

## Проверки
- Проверить полноту handoff от каждой роли.
- Проверить, что финальный результат соответствует исходному плану.
