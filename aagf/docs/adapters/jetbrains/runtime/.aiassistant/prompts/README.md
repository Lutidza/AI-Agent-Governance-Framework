<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml -->

# prompts

Здесь должны храниться переносимые prompt-шаблоны docs-контура для target `jetbrains`.

## Обязательные условия

- Prompt-шаблоны MUST быть согласованы с source-правилами в `docs/spec/**`.
- Prompt-шаблоны MUST NOT вводить правила, отсутствующие в source-слое.
- Prompt-шаблоны MUST быть совместимы с runtime-каталогом `.aiassistant/prompts/**`.
- IF prompt требует исключения из правил THEN исключение MUST быть явно подтверждено пользователем.

## Базовый маршрут построения prompt

1. Анализ source-контекста.
2. План с ограничениями и рисками.
3. Выполнение только в рамках согласованного контура.
4. Handoff с перечнем изменений и проверок.

## Диалоговый справочник AAFG

- Source of truth команд: `docs/spec/project/commands.catalog.yaml`.
- Дефолт исполнения: `mode=review`, `confirm_fix=true`, `output=structured-findings`.
- Если специалист пишет `aafg help`, агент MUST вывести краткий справочник команд из catalog.
- Если специалист пишет `aafg command <ID>`, агент MUST показать карточку команды (`syntax/params/safety_gate/examples`).
- Если специалист пишет `aafg defaults`, агент MUST показать текущие defaults каталога.
- Если специалист пишет `aafg:test <path> [fix|review]`, агент MUST выполнить только debug-разбор команды и MUST NOT изменять файлы.
- Для `aafg:test ... fix` агент MUST явно показать, что реальный fix требует confirm-gate.
- IF в запросе не указан `mode` THEN агент MUST использовать `mode=review`.
- IF запрошен `mode=fix` THEN агент MUST пройти confirm-gate перед правками.

### Команды из каталога
- `AAFG-CMD-HELP`: `aafg help [scope=file|rule|docs|project]`
  scope=`project`, mode=`review`, confirm_required=`false`
- `AAFG-CMD-COMMAND`: `aafg command <COMMAND_ID>`
  scope=`project`, mode=`review`, confirm_required=`false`
- `AAFG-CMD-DEFAULTS`: `aafg defaults`
  scope=`project`, mode=`review`, confirm_required=`false`
- `AAFG-CMD-TEST`: `aafg:test <path> [fix|review]`
  scope=`file`, mode=`mixed`, confirm_required=`false`
- `AAFG-CMD-FILE-REVIEW`: `aafg file <path> mode=review [rule=<RULE_ID>] [profile=<PROFILE_ID>]`
  scope=`file`, mode=`review`, confirm_required=`false`
- `AAFG-CMD-FILE-FIX`: `aafg file <path> mode=fix [rule=<RULE_ID>] [profile=<PROFILE_ID>]`
  scope=`file`, mode=`fix`, confirm_required=`true`
- `AAFG-CMD-RULE-EXPLAIN`: `aafg rule <RULE_ID> explain`
  scope=`rule`, mode=`review`, confirm_required=`false`
- `AAFG-CMD-RULES-TEST`: `aafg rules test [target=<path>] [profile=<PROFILE_ID>]`
  scope=`project`, mode=`mixed`, confirm_required=`false`
- `AAFG-CMD-DOCS-SYNC`: `aafg docs sync [target=jetbrains|cursor|all]`
  scope=`docs`, mode=`fix`, confirm_required=`true`

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
