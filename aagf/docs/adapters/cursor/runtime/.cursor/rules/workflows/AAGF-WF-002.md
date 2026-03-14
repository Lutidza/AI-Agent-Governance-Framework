<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/workflows/README.md -->

# AAGF-WF-002 Spec-Driven Documentation Workflow

Раздел source-спецификации: `workflows`

Назначение: Любое изменение документации должно проходить через aagf/docs/spec с обязательной синхронизацией производных слоев.

## Нормативные правила
- RULE: Нормативные изменения MUST вноситься сначала в aagf/docs/spec/**.
- RULE: После изменений MUST выполняться docs:generate и docs:check.
- RULE: Drift между source и derived слоями MUST NOT оставаться в репозитории.

## Условия IF -> THEN
- IF Изменение внесено только в generated файл THEN Агент MUST перенести изменение в соответствующий spec-файл и перегенерировать слой.
- IF docs:check возвращает drift THEN Изменение MUST считаться незавершенным до устранения drift.

## Контрольные проверки
- Проверить успех команд docs:validate, docs:generate, docs:check.
- Проверить, что generated файлы соответствуют обновленному source.

## Шаги workflow
- Обновить нужный spec-файл в aagf/docs/spec/**.
- Выполнить генерацию производных слоев.
- Проверить отсутствие drift и корректность отображения.
- Передать handoff с результатом проверок.

## Handoff
- Список измененных spec-файлов.
- Список сгенерированных файлов.
- Результаты validate/generate/check.
