<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/stacks/README.md + docs/adapters/cursor/runtime/.cursor/rules/stacks/AAGF-STACK-002.md -->

# AAGF-STACK-002 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `cursor`.

## Source mapping

- Product source section: `docs/spec/stacks/README.md`
- Adapter runtime source: `docs/adapters/cursor/runtime/.cursor/rules/stacks/AAGF-STACK-002.md`
- Runtime compatibility: `.cursor/rules/stacks/AAGF-STACK-002.md`
- Human projection path: `runtime/cursor/rules/stacks/AAGF-STACK-002.md`

## Контекст

- Section: `stacks` / Stacks
- Rule ID: `AAGF-STACK-002`
- Rule title: Документирование стековых допущений
- Intent: Для каждого стека должны быть формализованы ограничения, риски и критерии валидации.

## Нормативные правила
- Stack-spec MUST включать ограничения по зависимостям и версионированию.
- Stack-spec MUST включать требования к тестированию и quality gates.
- Stack-spec MUST использовать единый формат rule IDs и IF -> THEN условий.

## Условия IF -> THEN
- IF В stack-spec добавлена новая зависимость THEN MUST быть добавлены проверка совместимости и migration notes.
- IF Stack-изменение влияет на CI/CD THEN Изменение MUST быть отмечено как risk-critical и требовать подтверждения.

## Проверки
- Проверить наличие rule IDs, checks и risk notes.
- Проверить согласованность stack-spec с workflow и role спецификациями.
