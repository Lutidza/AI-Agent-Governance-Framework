<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/workflows/README.md -->

# workflows

Повторяемые сценарии выполнения задач агентами.

## Источник

- Spec-source: [`docs/spec/workflows/README.md`](../../spec/workflows/README.md)
- Spec-data: [`docs/spec/workflows/rules.index.yaml`](../../spec/workflows/rules.index.yaml)

## Операционные записи
### AAGF-WF-001 - Plan-First Change Workflow

Назначение: Любое нетривиальное изменение должно проходить анализ, план и контролируемое выполнение.

Правила:
- Для нетривиальной задачи агент MUST выполнить этапы analyze -> plan -> implement -> verify.
- Этап implement MUST NOT начинаться до фиксации плана.
- Handoff MUST содержать измененные файлы, риски и проверки.

IF -> THEN:
- IF Задача затрагивает архитектуру или несколько подсистем THEN Агент MUST использовать reasoning-intensive профиль и детальный план.
- IF На этапе verify обнаружен regression risk THEN Агент MUST остановить продвижение и предложить корректирующий план.

Проверки:
- Проверить наличие плана перед код-изменениями.
- Проверить полноту handoff и верификации.

Этапы:
1. Analyze текущего состояния и ограничений.
2. Plan с шагами, рисками и критериями завершения.
3. Implement в согласованном контуре.
4. Verify через валидацию, генерацию и drift-check.

Handoff:
- Перечень измененных файлов.
- Обоснование ключевых решений.
- Список обязательных проверок для следующего шага.

Prompt blueprints:
- `AAGF-PROMPT-PLAN-FIRST` — Plan First Execution: Принудить агента сначала анализировать и планировать, потом выполнять изменения.
### AAGF-WF-002 - Spec-Driven Documentation Workflow

Назначение: Любое изменение документации должно проходить через aagf/docs/spec с обязательной синхронизацией производных слоев.

Правила:
- Нормативные изменения MUST вноситься сначала в aagf/docs/spec/**.
- После изменений MUST выполняться docs:generate и docs:check.
- Drift между source и derived слоями MUST NOT оставаться в репозитории.

IF -> THEN:
- IF Изменение внесено только в generated файл THEN Агент MUST перенести изменение в соответствующий spec-файл и перегенерировать слой.
- IF docs:check возвращает drift THEN Изменение MUST считаться незавершенным до устранения drift.

Проверки:
- Проверить успех команд docs:validate, docs:generate, docs:check.
- Проверить, что generated файлы соответствуют обновленному source.

Этапы:
1. Обновить нужный spec-файл в aagf/docs/spec/**.
2. Выполнить генерацию производных слоев.
3. Проверить отсутствие drift и корректность отображения.
4. Передать handoff с результатом проверок.

Handoff:
- Список измененных spec-файлов.
- Список сгенерированных файлов.
- Результаты validate/generate/check.

Prompt blueprints:
- `AAGF-PROMPT-SPEC-SYNC` — Spec Sync Enforcement: Гарантировать, что документация обновляется через source-слой и проходит drift-контроль.
### AAGF-WF-003 - Local README Adjacency Sync Workflow

Назначение: Локальная документация модулей (components/utils/hooks/services и др.) должна читаться до правок и обновляться вместе с кодом.

Правила:
- IF рядом с изменяемым кодом есть README или другой docs-файл THEN агент MUST прочитать его до начала правок.
- После правок кода в соответствующем модуле агент MUST обновить затронутый локальный README/docs в том же изменении.
- Обновление локального README/docs MUST включать версию, дату изменения и лаконичное описание изменений.
- Локальный README/docs MUST отражать фактическое текущее поведение кода; устаревшие инструкции и противоречия MUST NOT оставаться.
- Для модульных директорий (например, components, utils, hooks, services) проект SHOULD поддерживать индивидуальные README как точку входа по назначению и использованию.

IF -> THEN:
- IF В каталоге изменяемого модуля найден README.md или другой docs-файл THEN Агент MUST обновить документ в том же PR/коммите, где изменен код модуля.
- IF В модульной директории обнаружены изменения публичного API/контракта поведения THEN Агент MUST синхронизировать разделы usage/contracts/examples в локальном README/docs.
- IF В модульной директории (components/utils/hooks/services) README отсутствует, а изменения затрагивают повторно используемый функционал THEN Агент MUST предложить создание индивидуального README и запросить подтверждение перед добавлением нового файла.

Проверки:
- Проверить, что для каждого измененного модуля с локальным README/docs документ обновлен в том же изменении.
- Проверить, что обновление README/docs содержит версию, дату и краткое описание изменений.
- Проверить отсутствие противоречий между локальной документацией и текущим кодом модуля.
- Проверить, что создание нового README для модульной папки выполнено только после явного подтверждения пользователя.
### AAGF-WF-BOOTSTRAP - AAGF Bootstrap Integration Workflow

Назначение: Интеграция AAGF в новый или существующий проект должна выполняться как управляемый протокол с явными фазами, confirm-gates и lock-конфигурацией.

Правила:
- Workflow MUST выполняться по фазам Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock.
- Install MUST подключать aagf/ в проект и MUST заменять root AGENTS.md install-шаблоном `aagf/docs/install/AGENTS.md` через явный dry-run/apply.
- Detect MUST выполняться через MCP tool `detect_stack_deep` и MUST публиковать `detect-started` с `project-root`, `detector-id`, `session-id`.
- Detect MUST формировать глубокий `stack-context` по уровням (`os/server/runtime/languages/frameworks/libraries/packages/databases/cache/messaging/ci/deploy`) с `id`, `version`, `confidence`, `evidence`, `source`.
- Confirm MUST требовать явное действие `confirm` или `edit`; bootstrap MUST NOT продолжаться без прохождения confirm/edit gate.
- IF выбран `edit` THEN правки MUST сохраняться в `aagf/docs/spec/project/stack-overrides.yaml` и MUST быть применены к итоговому `stack-context` перед Lock.
- Compose MUST формировать enabled packs и overrides до фазы Generate.
- Generate MUST собирать aagf/docs/human/** и aagf/docs/adapters/** только из aagf/docs/spec/**.
- Sync MUST выполняться только после явного подтверждения пользователя и только через target-aware sync-процесс.
- Lock MUST фиксировать итоговую конфигурацию проекта в `aagf/docs/spec/project/profile.lock.yaml` и MUST записывать `context.yaml`/`profile.lock.yaml` только после confirm/edit.
- Runtime rules/prompts/workflows MUST использовать подтвержденный `aagf/docs/spec/project/stack-context.yaml` как входной контекст.

IF -> THEN:
- IF Detect вернул unknown или low-confidence элементы THEN Агент MUST опубликовать structured summary (`stack.*`, `unknown-levels`, `low-confidence`) и MUST запросить explicit confirm/edit.
- IF Detection action (`confirm`/`edit`) отсутствует THEN Bootstrap MUST остановиться на phase Confirm без перехода в Compose/Generate/Lock.
- IF Специалист выбрал edit THEN Агент MUST сохранить правки в stack-overrides и MUST пересчитать итоговый stack-context до lock.
- IF Запрошена синхронизация runtime-контуров THEN Агент MUST сначала выполнить dry-run (`docs:sync:check`) и MUST применять sync только после явного подтверждения.
- IF Runtime-адаптеры не имеют подтвержденного stack-context THEN Агент MUST NOT использовать не подтвержденный профиль как active для rules/prompts/workflows.

Проверки:
- Проверить наличие aagf/docs/spec/project/context.yaml, stack-context.yaml, stack-overrides.yaml, stack-detection.yaml, enabled-packs.yaml, overrides.yaml и profile.lock.yaml.
- Проверить, что detect-результат содержит session-id, evidence, confidence, decision и stack_context_ref.
- Проверить, что Generate выполняется только из aagf/docs/spec/** без ручных правок derived-слоев.
- Проверить, что runtime sync прошел через confirm gate.
- Проверить, что lock-файл зафиксировал выбранный профиль, status confirm/edit и включенные packs.

Этапы:
1. Install: добавить aagf/ и заменить root AGENTS.md install-шаблоном через dry-run/apply.
2. Detect: запустить MCP `detect_stack_deep`, опубликовать detect-started и вывести structured summary результата.
3. Confirm: запросить explicit confirm/edit; при edit сохранить stack-overrides и пересчитать stack-context.
4. Compose: выбрать packs и локальные overrides.
5. Generate: собрать aagf/docs/human/** и aagf/docs/adapters/**.
6. Sync: синхронизировать runtime-цели только после явного подтверждения.
7. Lock: зафиксировать профиль и stack metadata в context/profile.lock только после confirm/edit.

Handoff:
- Результат Detect: session-id, выбранный стек, confidence, evidence, decision и stack_context_ref.
- Набор активированных packs и overrides.
- Статус Generate/Sync и перечень измененных файлов.
- Состояние context/profile.lock и рекомендации для следующего цикла.

Prompt blueprints:
- `AAGF-PROMPT-BOOTSTRAP-GUIDED` — Bootstrap Guided Orchestration: Оркестрировать диалог по фазам Detect/Confirm/Compose без нарушения non-destructive правил интеграции.

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
