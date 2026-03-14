<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/workflows/README.md -->

# workflows

Повторяемые сценарии выполнения задач агентами.

## Источник

- Spec-source: [`docs/spec/workflows/README.md`](../../spec/workflows/README.md)
- Spec-data: [`docs/spec/workflows/workflows.yaml`](../../spec/workflows/workflows.yaml)

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
### AAGF-WF-BOOTSTRAP - AAGF Bootstrap Integration Workflow

Назначение: Интеграция AAGF в новый или существующий проект должна выполняться как управляемый протокол с явными фазами, confirm-gates и lock-конфигурацией.

Правила:
- Workflow MUST выполняться по фазам Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock.
- Install MUST подключать aagf/ в проект и MUST применять root AGENTS.md только через merge-предложение без неявного overwrite.
- Detect MUST выполнять offline-детекцию стека и контекста проекта по артефактам репозитория и MUST вычислять confidence score.
- Confirm MUST применять пороги: confidence >= 0.85 -> auto; 0.60-0.84 -> explicit confirm; < 0.60 -> unknown profile и ручной выбор.
- Compose MUST формировать enabled packs и overrides до фазы Generate.
- Generate MUST собирать aagf/docs/human/** и aagf/docs/adapters/** только из aagf/docs/spec/**.
- Sync MUST выполняться только после явного подтверждения пользователя и только через target-aware sync-процесс.
- Lock MUST фиксировать итоговую конфигурацию проекта в aagf/docs/spec/project/profile.lock.yaml.

IF -> THEN:
- IF confidence находится в диапазоне 0.60-0.84 THEN Агент MUST остановиться на phase gate и MUST запросить явное подтверждение перед Generate/Sync.
- IF confidence ниже 0.60 THEN Агент MUST установить статус unknown и MUST NOT выполнять auto-apply профиля.
- IF Запрошена синхронизация runtime-контуров THEN Агент MUST сначала выполнить dry-run (`docs:sync:check`) и MUST применять sync только после явного подтверждения.
- IF Требуется изменение root AGENTS.md THEN Агент MUST сформировать diff/merge-предложение и MUST NOT перезаписывать файл автоматически.

Проверки:
- Проверить наличие aagf/docs/spec/project/context.yaml, stack-detection.yaml, enabled-packs.yaml, overrides.yaml и profile.lock.yaml.
- Проверить, что detect-результат содержит evidence, confidence и decision.
- Проверить, что Generate выполняется только из aagf/docs/spec/** без ручных правок derived-слоев.
- Проверить, что runtime sync прошел через confirm gate.
- Проверить, что lock-файл зафиксировал выбранный профиль и включенные packs.

Этапы:
1. Install: добавить aagf/ и подготовить merge-предложение для root AGENTS.md.
2. Detect: выполнить скан репозитория, собрать evidence и вычислить confidence.
3. Confirm: применить confidence-пороги и запросить подтверждение при необходимости.
4. Compose: выбрать packs и локальные overrides.
5. Generate: собрать aagf/docs/human/** и aagf/docs/adapters/**.
6. Sync: синхронизировать runtime-цели только после явного подтверждения.
7. Lock: зафиксировать профиль в profile.lock.yaml.

Handoff:
- Результат Detect: выбранный стек, confidence, evidence и decision.
- Набор активированных packs и overrides.
- Статус Generate/Sync и перечень измененных файлов.
- Состояние lock-файла и рекомендации для следующего цикла.

Prompt blueprints:
- `AAGF-PROMPT-BOOTSTRAP-GUIDED` — Bootstrap Guided Orchestration: Оркестрировать диалог по фазам Detect/Confirm/Compose без нарушения non-destructive правил интеграции.

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
