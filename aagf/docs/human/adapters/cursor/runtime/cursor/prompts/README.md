<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/adapters/cursor/runtime/.cursor/prompts/README.md -->

# prompts (human projection)

Этот документ является человеко-читаемой проекцией target-runtime prompts для `cursor`.

## Source mapping

- Product source: `docs/spec/**`
- Adapter runtime source: `docs/adapters/cursor/runtime/.cursor/prompts/README.md`
- Runtime compatibility: `.cursor/prompts/**`
- Human projection path: `runtime/cursor/prompts/**`

## Обязательные условия

- Prompt-шаблоны MUST извлекаться из workflow source-слоя.
- Prompt-шаблоны MUST NOT вводить правила, отсутствующие в `docs/spec/**`.
- IF runtime prompts расходятся с source-слоем THEN приоритет MUST быть у `docs/spec/**`.

## Диалоговый справочник AAFG (проекция)

- Source of truth команд: `docs/spec/project/commands.catalog.yaml`.
- Дефолты каталога: `mode=review`, `confirm_fix=true`, `output=structured-findings`.
- Runtime prompt MUST поддерживать команды `aafg help`, `aafg command <ID>`, `aafg defaults`.
- Runtime prompt MUST поддерживать debug-команду `aafg:test <path> [fix|review]` без внесения изменений в файлы.
- IF mode не указан в запросе THEN runtime prompt MUST интерпретировать запрос как `mode=review`.
- IF mode=`fix` THEN runtime prompt MUST требовать confirm-gate перед правками.

### Команды из каталога
- `AAFG-CMD-HELP`: `aafg help [scope=file|rule|docs|project]` (`scope=project`, `mode=review`, `confirm=false`)
- `AAFG-CMD-COMMAND`: `aafg command <COMMAND_ID>` (`scope=project`, `mode=review`, `confirm=false`)
- `AAFG-CMD-DEFAULTS`: `aafg defaults` (`scope=project`, `mode=review`, `confirm=false`)
- `AAFG-CMD-TEST`: `aafg:test <path> [fix|review]` (`scope=file`, `mode=mixed`, `confirm=false`)
- `AAFG-CMD-FILE-REVIEW`: `aafg file <path> mode=review [rule=<RULE_ID>] [profile=<PROFILE_ID>]` (`scope=file`, `mode=review`, `confirm=false`)
- `AAFG-CMD-FILE-FIX`: `aafg file <path> mode=fix [rule=<RULE_ID>] [profile=<PROFILE_ID>]` (`scope=file`, `mode=fix`, `confirm=true`)
- `AAFG-CMD-RULE-EXPLAIN`: `aafg rule <RULE_ID> explain` (`scope=rule`, `mode=review`, `confirm=false`)
- `AAFG-CMD-RULES-TEST`: `aafg rules test [target=<path>] [profile=<PROFILE_ID>]` (`scope=project`, `mode=mixed`, `confirm=false`)
- `AAFG-CMD-DOCS-SYNC`: `aafg docs sync [target=jetbrains|cursor|all]` (`scope=docs`, `mode=fix`, `confirm=true`)

## Prompt Blueprints из workflow-spec
### AAGF-PROMPT-PLAN-FIRST - Plan First Execution

Источник: `workflows` / `AAGF-WF-001 (Plan-First Change Workflow)`

Цель: Принудить агента сначала анализировать и планировать, потом выполнять изменения.

Шаблон:
```text
Роль: исполнитель изменения.
Вход: описание задачи и целевой контур.
Шаг 1: Выполни анализ текущего состояния.
Шаг 2: Сформируй план с рисками и критериями завершения.
Шаг 3: Выполни изменения только после фиксации плана.
Шаг 4: Верни handoff: файлы, риски, проверки.

```
### AAGF-PROMPT-SPEC-SYNC - Spec Sync Enforcement

Источник: `workflows` / `AAGF-WF-002 (Spec-Driven Documentation Workflow)`

Цель: Гарантировать, что документация обновляется через source-слой и проходит drift-контроль.

Шаблон:
```text
Роль: maintainer документации.
Шаг 1: Обнови source-правила в aagf/docs/spec/**.
Шаг 2: Запусти docs:generate.
Шаг 3: Запусти docs:check.
Шаг 4: Подготовь handoff с перечнем обновленных артефактов и статусом drift.

```
### AAGF-PROMPT-BOOTSTRAP-GUIDED - Bootstrap Guided Orchestration

Источник: `workflows` / `AAGF-WF-BOOTSTRAP (AAGF Bootstrap Integration Workflow)`

Цель: Оркестрировать диалог по фазам Detect/Confirm/Compose без нарушения non-destructive правил интеграции.

Шаблон:
```text
Роль: оркестратор bootstrap-интеграции AAGF.
Фаза Detect: запусти MCP detect_stack_deep, опубликуй detect-started и покажи stack summary + unknown/low-confidence.
Фаза Confirm: запроси explicit confirm/edit; при edit сохрани правки в stack-overrides и пересобери stack-context.
Фаза Compose: предложи packs и overrides, зафиксируй выбор.
Фаза Generate: выполняй только из aagf/docs/spec/**.
Фаза Sync: запрашивай явное подтверждение перед runtime-синхронизацией.
Фаза Lock: зафиксируй итоговую конфигурацию в context/profile.lock только после confirm/edit.
Во всех правилах и промптах используй подтвержденный stack-context из aagf/docs/spec/project/stack-context.yaml.

```
