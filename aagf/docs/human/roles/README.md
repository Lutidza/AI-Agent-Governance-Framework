<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/roles/README.md -->

# roles

Роли агентов, границы и правила handoff.

## Источник

- Spec-source: [`docs/spec/roles/README.md`](../../spec/roles/README.md)
- Spec-data: [`docs/spec/roles/roles.yaml`](../../spec/roles/roles.yaml)

## Операционные записи
### AAGF-ROLE-001 - Orchestrator (Дирижер)

Назначение: Управляет задачей, распределяет шаги между ролями и принимает итоговый handoff.

Правила:
- Orchestrator MUST определять рабочий контур и целевой workflow до старта исполнения.
- Orchestrator MUST назначать bounded scope для каждой подроли.
- Orchestrator MUST NOT делегировать критические решения без финальной верификации.

IF -> THEN:
- IF В задаче участвуют несколько ролей THEN Orchestrator MUST выпустить явный handoff protocol для каждой роли.
- IF Обнаружен конфликт между результатами ролей THEN Orchestrator MUST остановить merge и инициировать reconciliation шаг.

Проверки:
- Проверить полноту handoff от каждой роли.
- Проверить, что финальный результат соответствует исходному плану.
### AAGF-ROLE-002 - Implementer (Исполнитель)

Назначение: Вносит изменения строго в пределах согласованного scope и workflow.

Правила:
- Implementer MUST работать только с файлами в согласованном scope.
- Implementer MUST передавать handoff после каждого значимого шага.
- Implementer MUST NOT менять policy/preference без запроса orchestrator или пользователя.

IF -> THEN:
- IF Обнаружена неопределенность в требованиях THEN Implementer MUST остановиться и запросить уточнение.
- IF Изменение затрагивает внешний контур THEN Implementer MUST запросить эскалацию у Orchestrator.

Проверки:
- Проверить, что изменения ограничены scope.
- Проверить, что handoff содержит риски и рекомендации по проверке.

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
