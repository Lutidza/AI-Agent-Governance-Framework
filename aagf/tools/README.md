# docs-build

CLI-утилита генерации и синхронизации производных слоев AAGF.

## Область

- Source layer: `docs/spec/**`.
- Generated layers: `docs/human/**`, `docs/adapters/**`.
- Runtime sync targets: `/.aiassistant/**`, `/.cursor/**` в корне целевого проекта.

## Запуск

Из папки `aagf/`:

- `npm run docs:validate`
- `npm run docs:generate -- --target jetbrains|cursor|all`
- `npm run docs:check -- --target jetbrains|cursor|all`
- `npm run docs:test -- --target jetbrains|cursor|all`
- `npm run docs:sync -- --target jetbrains|cursor|all`
- `npm run docs:sync:check -- --target jetbrains|cursor|all`
- `npm run docs:detect-stack -- --project-root ..`
- `npm run docs:bootstrap -- --project-root .. --guided`

Из корня этого репозитория:

- `npm run docs:validate`
- `npm run docs:test -- --target all`
- `npm run docs:detect-stack`
- `npm run docs:bootstrap -- --guided`

## Контракт

- `docs/spec/**` MUST быть единственным редактируемым machine-readable source.
- `docs/human/**` и `docs/adapters/**` MUST обновляться только через генерацию.
- IF `sync --check` обнаруживает pending изменения THEN команда MUST завершаться с кодом `1`.
- Runtime sync MUST применяться только по явному подтверждению пользователя.
