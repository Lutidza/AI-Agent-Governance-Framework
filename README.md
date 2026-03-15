# AI-Agent-Governance-Framework (AAGF)

Репозиторий содержит контур развития AAGF и продуктовый дистрибутив `aagf/` для внедрения в другие проекты.
Работай с этим репозиторием только как AI-агент: выполняй инструкции как обязательный операционный протокол.

## Что Такое AAGF

AAGF (AI Agent Governance Framework) — это фреймворк управления AI-агентами в программной инженерии.
Его цель: сделать работу агентов предсказуемой, проверяемой и адаптируемой под конкретный проект без потери управляемости.

AAGF решает ключевые задачи:

- задает формальные правила, роли, workflow и границы автономности агентов;
- фиксирует единый source of truth для governance-логики;
- отделяет редактируемый source-слой от generated-представлений;
- поддерживает multi-target проекции под JetBrains и Cursor;
- снижает drift между policy-моделью, документацией и runtime-слоями IDE.

## Быстрый Старт Для AI-Агента

Начни с machine-readable guide для AI-агента:

- [`docs/installation/install.mcp.yaml`](./docs/installation/install.mcp.yaml) — **если ты ИИ, тебе сюда**.

После этого открой человеко-читаемый runbook и выполни шаги без отклонений:

- [`docs/installation/README.md`](./docs/installation/README.md)
- Полная карта документации: [`docs/README.md`](./docs/README.md)

Выбери сценарий по целевой ОС:

- Ubuntu (`bash`)
- Windows (`PowerShell`)

Если AAGF уже установлен, выполни этот промпт в рабочем диалоге:

> Проанализируй файл README.md в этом репозитории и интегрируй AAGF в текущий проект.

## Системная Модель

AAGF в текущей версии трактуется как система из трех частей.

1. Контур развития (Control Plane).

- Корневые `README.md` и `AGENTS.md`.
- Управляет эволюцией самого framework.
- Определяет архитектуру, правила разработки и контроль изменений AAGF.

2. Reference-контур.

- `docs/initial-data/**`.
- Содержит входные архитектурные материалы.
- Используется как контекст проектирования, но не как runtime-источник правил.

3. Продуктовый дистрибутив (Delivery Plane).

- Папка `aagf/`.
- Это конечный поставляемый продукт AAGF.
- Внедряется в целевой проект и образует там локальный инстанс AAGF.
- В следующем этапе эволюции продуктовый дистрибутив `aagf/` будет вынесен в отдельный репозиторий.

## Инстанс AAGF В Целевом Проекте

После переноса `aagf/` в целевой репозиторий создается локальный инстанс AAGF, который:

- определяет контекст и стек проекта;
- подбирает и активирует policy/workflow/role packs;
- генерирует человеко-читаемые и IDE-адаптерные слои;
- синхронизирует runtime-конфигурации (`/.aiassistant/**`, `/.cursor/**`) по explicit confirm;
- позволяет системно оптимизировать архитектуру и процесс разработки вокруг себя.

Это означает, что AAGF способен:

- развивать собственный функционал в контуре развития;
- развивать и адаптировать свой продуктовый дистрибутив;
- встраиваться в существующие приложения и архитектуры;
- подстраиваться под ограничения конкретного проекта и дооптимизировать его инженерный контур.
- оптимизировать собственные инструкции, правила и структуру контуров по мере развития governance-модели.

## Структура Продуктового Дистрибутива

- `aagf/docs/spec/**` — единственный редактируемый machine-readable source layer.
- `aagf/docs/human/**` — generated human-readable проекция `spec/**`.
- `aagf/docs/adapters/**` — generated adapter-проекции под JetBrains/Cursor.
- `aagf/tools/**` — CLI-контур (`validate/generate/check/test/detect-stack/bootstrap/sync`).
- `aagf/package.json` — точка запуска команд дистрибутива.

Базовый принцип:

- IF изменяется правило THEN правка MUST вноситься сначала в `aagf/docs/spec/**`.
- IF обновлен source-слой THEN `human/**` и `adapters/**` MUST пересобираться генерацией.
- IF требуется IDE-runtime синхронизация THEN sync MUST выполняться отдельно и только по явному подтверждению.

Модель правил (зафиксировано для vNext):

- Правила в `aagf/docs/spec/**` MUST храниться модульно (раздельные rule-файлы по назначению), а не в одном монолитном документе.
- Каждый rule-файл MUST иметь стабильный `rule_id`, область применения и явные условия активации.
- В `rules`-контуре MUST генерироваться индекс/карта содержимого (rule map) для навигации и аудита.
- Включение/выключение групп правил MUST выполняться через `aagf/docs/spec/project/enabled-packs.yaml` и `aagf/docs/spec/project/overrides.yaml`.
- Runtime adapter-выход MUST включать индекс `rules/README.md` и отдельные rule-entry файлы `rules/<section>/<rule-id>-<file-slug>.<ext>`; монолитный единый rules-файл MUST NOT быть целевым форматом.

Базовая типизация правил (baseline):

- `MUST` — обязывающее правило.
- `MUST NOT` — запрещающее правило.
- `IF -> THEN MUST` — условно-обязывающее правило.
- `SHOULD` — рекомендательное правило.

Базовые группы правил для разных web-стеков (зафиксированный каталог v1):

- `CFG` (Конфигурация AAGF): source-of-truth в `aagf/docs/spec/**`, запрет ручных правок generated-слоев, drift-control, межконтурные изменения только по explicit confirm.
- `RUL` (Модель правил): модульные rule-файлы, стабильные `rule_id`, обязательный rules index/map, selective enable/disable только через packs/overrides.
- `BOOT` (Bootstrap workflow): фазы `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`, dry-run по умолчанию, non-destructive apply.
- `DET` (Детекция стека): MCP-only deep detection по уровням (`os/server/runtime/language/frameworks/libraries/packages/db/...`), confidence thresholds (`>=0.85 auto`, `0.60-0.84 confirm`, `<0.60 unknown`), обязательный диалоговый confirm/edit.
- `GEN` (Генерация и sync): детерминированная генерация, target-aware режим `jetbrains|cursor|all`, runtime-sync только по явной команде.
- `CODE` (Инженерный код-стандарт): запрет заглушек и скрытых TODO в финальном коде, минимально-инвазивные изменения, комментарии для нетривиальных контрактов.
- `QA` (Тесты и валидация): обязательные quality gates (`lint/typecheck/tests/build`), запрет статуса done без проверяемого результата, change-type + compatibility notes.
- `SEC` (Безопасность): запрет секретов в репозитории/логах, подтверждение деструктивных действий, валидация входа и безопасные дефолты.
- `OPS` (DevOps/системные): CI зеркалирует локальные проверки, воспроизводимость зависимостей/сборки, migration/rollback для breaking-изменений.
- `AI` (AI-оркестрация): prompts как оркестрация, а не источник policy; явная фиксация допущений/уверенности; MCP обязателен для `Detect`, а в остальных workflow может использоваться как enrichment.

Целевой нейминг секций policy-слоя (`aagf/docs/spec/**`):

- `core` — базовые стек-независимые инварианты governance.
- `distribution` — системные правила продуктового дистрибутива AAGF (`install/bootstrap/detect/compose/generate/sync/lock`, versioning, compatibility).
- `ops` — DevOps-контур (CI/CD, quality gates, release, rollback, reproducibility).
- `engineering` — инженерные правила кода, комментариев и практик реализации.
- `security` — правила безопасности, доступа, секретов и ограничений рискованных действий.
- `stacks`, `workflows`, `roles`, `adapters`, `project` — профильные секции модели без переименования.

Нормативные префиксы rule-id для базовых секций:

- `AAGF-CORE-*`
- `AAGF-DIST-*`
- `AAGF-OPS-*`
- `AAGF-ENG-*`
- `AAGF-SEC-*`

## Интеграция В Целевой Проект

Перейди в [`docs/installation/README.md`](./docs/installation/README.md) и выполни полный цикл установки.

- Для Ubuntu используй раздел `Ubuntu (bash)`.
- Для Windows используй раздел `Windows (PowerShell)`.
- Для любого сценария строго выполни фазы `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.

## Команды (Из Корня Текущего Репозитория)

- `npm run docs:validate`
- `npm run docs:generate -- --target jetbrains|cursor|all`
- `npm run docs:check -- --target jetbrains|cursor|all`
- `npm run docs:test -- --target jetbrains|cursor|all`
- `npm run docs:detect-stack`
- `npm run docs:bootstrap -- --guided`
- `npm run docs:sync -- --target jetbrains|cursor|all`
- `npm run docs:sync:check -- --target jetbrains|cursor|all`

## Операционные Спецификации

Нормативные детали протоколов находятся в source-слое:

- `aagf/docs/spec/workflows/rules.index.yaml`
- `aagf/docs/spec/adapters/rules.index.yaml`
- `aagf/docs/spec/project/*.yaml`
