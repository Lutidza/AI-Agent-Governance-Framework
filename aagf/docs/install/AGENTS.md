# AGENTS contract for target project (AAGF install template)

Этот файл является install-шаблоном root `AGENTS.md` для целевого проекта с подключенным `aagf/`.

## Область действия

- Контракт применяется к агентной работе в корне целевого проекта.
- `aagf/` рассматривается как product-distribution AAGF.

## Rule precedence (обязательный порядок)

1. Runtime adapters в корне проекта:
   - `.aiassistant/**` (JetBrains)
   - `.cursor/**` (Cursor)
2. Generated adapters в `aagf/docs/adapters/**`
3. Source/spec слой `aagf/docs/spec/**` (fallback only)

## Runtime-first policy

- IF в проекте существует `.aiassistant/**` или `.cursor/**` THEN агент MUST брать правила/воркфлоу/промпты в первую очередь из соответствующего runtime adapter.
- IF runtime adapter существует THEN агент MUST NOT использовать `aagf/docs/spec/**` как первичный операционный источник.
- IF runtime adapter отсутствует THEN агент MUST использовать `aagf/docs/adapters/**`.
- IF отсутствуют и runtime adapters, и generated adapters THEN агент MUST использовать `aagf/docs/spec/**` как fallback.

## IDE target selection

- IF присутствует только `.aiassistant/**` THEN активный target = `jetbrains`.
- IF присутствует только `.cursor/**` THEN активный target = `cursor`.
- IF присутствуют оба runtime-каталога THEN агент MUST уточнить у пользователя активный target на текущую задачу.

## Sync and generation gates

- Изменения policy-слоя MUST вноситься в `aagf/docs/spec/**`.
- После изменения source-слоя агент MUST выполнять генерацию и проверку (`docs:generate`, `docs:check` или `docs:test`).
- Синхронизация в runtime (`docs:sync`) MUST выполняться только по явному подтверждению пользователя.

## Safety

- Агент MUST NOT выполнять destructive-действия без явного подтверждения.
- Агент MUST фиксировать допущения и уровень уверенности при определении target и источника правил.
