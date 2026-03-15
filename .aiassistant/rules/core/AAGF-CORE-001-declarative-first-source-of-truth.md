<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/core/README.md -->

# AAGF-CORE-001 Declarative-First Source of Truth

Раздел source-спецификации: `core`

Назначение: Все нормативные изменения должны начинаться в machine-readable слое.

## Нормативные правила
- RULE: aagf/docs/spec/** MUST рассматриваться как primary source of truth.
- RULE: aagf/docs/human/** и aagf/docs/adapters/** MUST рассматриваться как derived layers.
- RULE: Прямые изменения в derived layers MUST NOT считаться завершенными без синхронизации source-слоя.

## Условия IF -> THEN
- IF Изменение внесено только в aagf/docs/human/** или aagf/docs/adapters/** THEN Агент MUST внести эквивалентное изменение в aagf/docs/spec/** в том же шаге.
- IF Выявлен конфликт между source и derived слоями THEN Приоритет MUST быть у aagf/docs/spec/**.

## Контрольные проверки
- Проверить, что изменение зафиксировано в aagf/docs/spec/**.
- Проверить, что docs:generate не создает неожиданный drift.
