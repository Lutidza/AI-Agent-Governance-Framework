<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/adapters/cursor/runtime/.cursor/rules/README.md -->

# rules (human projection)

Этот документ является человеко-читаемой проекцией индекса target-runtime rules для `cursor`.

## Source mapping

- Product source: `docs/spec/**`
- Adapter runtime index source: `docs/adapters/cursor/runtime/.cursor/rules/README.md`
- Runtime compatibility: `.cursor/rules/**`
- Human projection path: `runtime/cursor/rules/**`

## Обязательные условия

- Правила MUST извлекаться из `docs/spec/**`.
- Правила MUST NOT вводить новые нормативные пункты, отсутствующие в source-слое.
- IF runtime rules расходятся с source-слоем THEN приоритет MUST быть у `docs/spec/**`.

## Модульная структура

- Runtime rules MUST быть разбиты на отдельные rule-entry файлы.
- Human projection MUST повторять модульную структуру runtime-слоя.
- IF отсутствует entry-файл для source-правила THEN это MUST считаться drift.

## Карта rule-entry файлов по секциям
### Core (`core`)
- [`AAGF-CORE-001` Declarative-First Source of Truth](./core/AAGF-CORE-001.md)
- [`AAGF-CORE-002` Контурная изоляция](./core/AAGF-CORE-002.md)
- [`AAGF-CORE-003` Stack-Profiled Commenting Contract](./core/AAGF-CORE-003.md)
### Stacks (`stacks`)
- [`AAGF-STACK-001` Stack Pack как заменяемый модуль](./stacks/AAGF-STACK-001.md)
- [`AAGF-STACK-002` Документирование стековых допущений](./stacks/AAGF-STACK-002.md)
### Workflows (`workflows`)
- [`AAGF-WF-001` Plan-First Change Workflow](./workflows/AAGF-WF-001.md)
- [`AAGF-WF-002` Spec-Driven Documentation Workflow](./workflows/AAGF-WF-002.md)
- [`AAGF-WF-BOOTSTRAP` AAGF Bootstrap Integration Workflow](./workflows/AAGF-WF-BOOTSTRAP.md)
### Roles (`roles`)
- [`AAGF-ROLE-001` Orchestrator (Дирижер)](./roles/AAGF-ROLE-001.md)
- [`AAGF-ROLE-002` Implementer (Исполнитель)](./roles/AAGF-ROLE-002.md)
### Adapters (`adapters`)
- [`AAGF-ADAPTER-001` Docs -> Human Projection Mapping](./adapters/AAGF-ADAPTER-001.md)
- [`AAGF-ADAPTER-002` Docs -> Multi-Target IDE Projection Mapping](./adapters/AAGF-ADAPTER-002.md)
