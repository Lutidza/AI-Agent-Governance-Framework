<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/workflows/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-003-local-readme-adjacency-sync.md -->

# AAGF-WF-003 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/workflows/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/workflows/AAGF-WF-003-local-readme-adjacency-sync.md`
- Runtime compatibility: `.aiassistant/rules/workflows/AAGF-WF-003-local-readme-adjacency-sync.md`
- Human projection path: `runtime/aiassistant/rules/workflows/AAGF-WF-003-local-readme-adjacency-sync.md`

## Контекст

- Section: `workflows` / Workflows
- Rule ID: `AAGF-WF-003`
- Rule title: Local README Adjacency Sync Workflow
- Intent: Для каждой изменяемой модульной папки README.md обязателен: существующий README обновляется, отсутствующий README создается.

## Нормативные правила
- Для каждой папки, где агент изменяет код, MUST существовать локальный README.md.
- IF локальный README.md уже существует THEN агент MUST прочитать его до начала правок и MUST обновить в том же изменении.
- IF локальный README.md отсутствует THEN агент MUST создать README.md в этой папке в том же изменении.
- Обновление или создание README.md MUST включать version, updated_at, changes_full, changes_short.
- README.md MUST отражать фактическое текущее поведение кода; устаревшие инструкции, противоречия и битые ссылки MUST NOT оставаться.
- В handoff агент MUST указывать полный путь от корня проекта до каждого созданного/обновленного README.md.

## Условия IF -> THEN
- IF В папке измененного кода найден README.md THEN Агент MUST прочитать и обновить этот README.md в том же PR/коммите.
- IF В папке измененного кода README.md отсутствует THEN Агент MUST создать README.md в этой папке до завершения задачи.
- IF Обновлены API, контракты, сценарии использования, конфигурация или зависимости THEN README.md MUST быть синхронизирован по разделам usage/contracts/setup/dependencies/examples.
- IF README.md не был создан или обновлен в измененной папке THEN Задача MUST NOT переходить в done.

## Проверки
- Проверить, что для каждой папки с измененным кодом существует локальный README.md после выполнения задачи.
- Проверить, что существующие README.md были обновлены, а отсутствующие README.md созданы в том же изменении.
- Проверить, что каждый созданный/обновленный README.md содержит version, updated_at, changes_full, changes_short.
- Проверить отсутствие противоречий между README.md и фактическим кодом модуля.
- Проверить валидность ссылок и путей в README.md.
- Проверить, что в handoff перечислены полные пути до всех созданных/обновленных README.md.
