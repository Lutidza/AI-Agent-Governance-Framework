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
2. Не копировать `aagf/docs/AGENTS.md` в корень целевого проекта.
3. В root `AGENTS.md` целевого проекта добавить bridge-правило:
   - IF задача относится к governance/правилам/процессам AAGF THEN агент MUST применять `aagf/docs/README.md` и `aagf/docs/AGENTS.md` как продуктовый контракт.
4. При необходимости смержить root `AGENTS.md` только в merge-режиме.
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
