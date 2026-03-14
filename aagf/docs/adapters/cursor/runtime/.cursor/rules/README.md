<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml -->

# rules

Индекс переносимых rule-артефактов docs-контура для target `cursor`.

## Обязательные условия

- Rule-файлы MUST опираться на `docs/spec/**`.
- Rule-файлы MUST использовать нормативные маркеры `MUST`, `MUST NOT`, `MAY`.
- Rule-файлы MUST быть совместимы с runtime-каталогом `.cursor/rules/**`.
- IF rule конфликтует с source-слоем THEN конфликт MUST быть устранен через изменение `docs/spec/**`.

## Модульная структура

- Каждый rule-entry MUST храниться в отдельном файле `.cursor/rules/<section>/<rule-id>.md`.
- Индекс MUST использоваться только как навигационный и контрольный артефакт.
- IF в `rules/README.md` присутствуют нормативные пункты без entry-файлов THEN генерация MUST считаться неконсистентной.

## Карта rule-файлов по source-спецификациям
### core
- [`AAGF-CORE-001` Declarative-First Source of Truth](./core/AAGF-CORE-001.md)
- [`AAGF-CORE-002` Контурная изоляция](./core/AAGF-CORE-002.md)
- [`AAGF-CORE-003` Stack-Profiled Commenting Contract](./core/AAGF-CORE-003.md)
### stacks
- [`AAGF-STACK-001` Stack Pack как заменяемый модуль](./stacks/AAGF-STACK-001.md)
- [`AAGF-STACK-002` Документирование стековых допущений](./stacks/AAGF-STACK-002.md)
### workflows
- [`AAGF-WF-001` Plan-First Change Workflow](./workflows/AAGF-WF-001.md)
- [`AAGF-WF-002` Spec-Driven Documentation Workflow](./workflows/AAGF-WF-002.md)
- [`AAGF-WF-BOOTSTRAP` AAGF Bootstrap Integration Workflow](./workflows/AAGF-WF-BOOTSTRAP.md)
### roles
- [`AAGF-ROLE-001` Orchestrator (Дирижер)](./roles/AAGF-ROLE-001.md)
- [`AAGF-ROLE-002` Implementer (Исполнитель)](./roles/AAGF-ROLE-002.md)
### adapters
- [`AAGF-ADAPTER-001` Docs -> Human Projection Mapping](./adapters/AAGF-ADAPTER-001.md)
- [`AAGF-ADAPTER-002` Docs -> Multi-Target IDE Projection Mapping](./adapters/AAGF-ADAPTER-002.md)
