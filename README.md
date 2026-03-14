# AI-Agent-Governance-Framework (AAGF)

Репозиторий содержит контур развития AAGF и продуктовый дистрибутив `aagf/` для внедрения в другие проекты.

## Что Такое AAGF

AAGF (AI Agent Governance Framework) — это фреймворк управления AI-агентами в программной инженерии.
Его цель: сделать работу агентов предсказуемой, проверяемой и адаптируемой под конкретный проект без потери управляемости.

AAGF решает ключевые задачи:

- задает формальные правила, роли, workflow и границы автономности агентов;
- фиксирует единый source of truth для governance-логики;
- отделяет редактируемый source-слой от generated-представлений;
- поддерживает multi-target проекции под JetBrains и Cursor;
- снижает drift между policy-моделью, документацией и runtime-слоями IDE.

## Системная Модель

AAGF в текущей версии трактуется как система из трех частей.

1. Контур развития (Control Plane).

- Корневые `README.md` и `AGENTS.md`.
- Управляет эволюцией самого framework.
- Определяет архитектуру, правила разработки и контроль изменений AAGF.

2. Reference-контур.

- `initial-data/**`.
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
- Adapter-выход MAY быть агрегирован в один runtime-файл для IDE, если это требует target-платформа; source-модульность при этом MUST сохраняться.

Базовая типизация правил (baseline):

- `MUST` — обязывающее правило.
- `MUST NOT` — запрещающее правило.
- `IF -> THEN MUST` — условно-обязывающее правило.
- `SHOULD` — рекомендательное правило.

Базовые группы правил для разных web-стеков (зафиксированный каталог v1):

- `CFG` (Конфигурация AAGF): source-of-truth в `aagf/docs/spec/**`, запрет ручных правок generated-слоев, drift-control, межконтурные изменения только по explicit confirm.
- `RUL` (Модель правил): модульные rule-файлы, стабильные `rule_id`, обязательный rules index/map, selective enable/disable только через packs/overrides.
- `BOOT` (Bootstrap workflow): фазы `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`, dry-run по умолчанию, non-destructive apply.
- `DET` (Детекция стека): evidence-based scoring, confidence thresholds (`>=0.85 auto`, `0.60-0.84 confirm`, `<0.60 unknown`), обязательный confirm при низкой уверенности.
- `GEN` (Генерация и sync): детерминированная генерация, target-aware режим `jetbrains|cursor|all`, runtime-sync только по явной команде.
- `CODE` (Инженерный код-стандарт): запрет заглушек и скрытых TODO в финальном коде, минимально-инвазивные изменения, комментарии для нетривиальных контрактов.
- `QA` (Тесты и валидация): обязательные quality gates (`lint/typecheck/tests/build`), запрет статуса done без проверяемого результата, change-type + compatibility notes.
- `SEC` (Безопасность): запрет секретов в репозитории/логах, подтверждение деструктивных действий, валидация входа и безопасные дефолты.
- `OPS` (DevOps/системные): CI зеркалирует локальные проверки, воспроизводимость зависимостей/сборки, migration/rollback для breaking-изменений.
- `AI` (AI-оркестрация): prompts как оркестрация, а не источник policy; явная фиксация допущений/уверенности; MCP как optional enrichment при офлайн-работоспособном core.

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

1. Добавить папку `aagf/` в корень целевого проекта.
   Рекомендуемый способ: sparse-clone только каталога `aagf/` из репозитория AAGF.
   - `git clone --filter=blob:none --sparse https://github.com/Lutidza/AI-Agent-Governance-Framework.git .aagf-src`
   - `cd .aagf-src`
   - `git sparse-checkout set aagf`
   - `git checkout <branch-or-tag>`
   - `cd ..`
   - `cp -R .aagf-src/aagf ./aagf`
   - `rm -rf .aagf-src`
   - Для PowerShell используйте эквиваленты: `Copy-Item -Recurse` и `Remove-Item -Recurse -Force`.
2. На этапе установки root `AGENTS.md` целевого проекта MUST заменяться шаблоном `aagf/docs/install/AGENTS.md`.
   - Автоматически это выполняется в `docs:bootstrap -- --apply`.
   - Вручную (если нужно): `Copy-Item -Force .\\aagf\\docs\\install\\AGENTS.md .\\AGENTS.md`.
3. После установки root `AGENTS.md` MUST применять приоритет источников:
   - runtime adapters в корне проекта (`.aiassistant/**`, `.cursor/**`) -> первичный источник;
   - `aagf/docs/adapters/**` -> если runtime adapters отсутствуют;
   - `aagf/docs/spec/**` -> только fallback при отсутствии runtime/adapters.
4. IF runtime adapters существуют THEN агенту не нужно использовать `aagf/docs/spec/**` как первичный операционный источник.
5. Запустить dry-run детекции:
   - `cd aagf`
   - `npm run docs:detect-stack`
   - Dry-run выводит результат в консоль и не изменяет файлы.
   - Для записи результата детекции в spec-слой: `npm run docs:detect-stack -- --apply`.
   - Результат детекции записывается в:
     - `aagf/docs/spec/project/stack-detection.yaml`
     - `aagf/docs/spec/project/context.yaml`
6. Запустить bootstrap:
   - `npm run docs:bootstrap -- --guided`
7. Сгенерировать и проверить производные слои:
   - `npm run docs:test -- --target all`
8. По явному подтверждению синхронизировать runtime:
   - `npm run docs:sync -- --target all`

## Быстрые Команды Для Теста В Целевом Проекте

Ниже команды в формате copy/paste для PowerShell.

Клонировать только дистрибутив `aagf/` из репозитория:

```powershell
git clone --filter=blob:none --sparse https://github.com/Lutidza/AI-Agent-Governance-Framework.git .aagf-src
Set-Location .aagf-src
git sparse-checkout set aagf
git checkout main
Set-Location ..
Copy-Item -Recurse -Force .aagf-src\aagf .\aagf
Remove-Item -Recurse -Force .aagf-src
```

Минимальный прогон (dry-run + проверка генерации):

```powershell
Set-Location .\aagf
npm.cmd install
npm.cmd run docs:detect-stack
npm.cmd run docs:bootstrap -- --guided
npm.cmd run docs:test -- --target all
```

Полный прогон с записью детекции/лока и sync runtime:

```powershell
Set-Location .\aagf
npm.cmd run docs:detect-stack -- --apply
npm.cmd run docs:bootstrap -- --guided --apply --confirm-detection
npm.cmd run docs:test -- --target all
npm.cmd run docs:sync -- --target all
```

После полного прогона ожидаемые артефакты:
- `aagf/docs/spec/project/stack-detection.yaml`
- `aagf/docs/spec/project/context.yaml`
- `aagf/docs/spec/project/profile.lock.yaml`
- `AGENTS.md` в корне целевого проекта (заменен из `aagf/docs/install/AGENTS.md`)
- `.aiassistant/**` и `.cursor/**` в корне целевого проекта

## Команды (Из Корня Текущего Репозитория)

- `npm run docs:validate`
- `npm run docs:generate -- --target jetbrains|cursor|all`
- `npm run docs:check -- --target jetbrains|cursor|all`
- `npm run docs:test -- --target jetbrains|cursor|all`
- `npm run docs:detect-stack`
- `npm run docs:bootstrap -- --guided`
- `npm run docs:sync -- --target jetbrains|cursor|all`
- `npm run docs:sync:check -- --target jetbrains|cursor|all`

## Протокол Bootstrap

Обязательные фазы: `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.

- `Detect` использует `aagf/docs/spec/project/stack-detection.yaml`.
- `Detect` в dry-run выводит результат в консоль; при `--apply` записывает результат в `aagf/docs/spec/project/stack-detection.yaml` и `aagf/docs/spec/project/context.yaml`.
- `Compose` управляет packs и overrides через `aagf/docs/spec/project/enabled-packs.yaml` и `aagf/docs/spec/project/overrides.yaml`.
- `Lock` фиксирует профиль в `aagf/docs/spec/project/profile.lock.yaml`.
