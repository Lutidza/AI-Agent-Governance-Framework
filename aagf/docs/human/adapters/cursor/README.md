<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/adapters/cursor/** -->

# adapters/cursor (human projection)

Этот документ описывает человеко-читаемую проекцию target-адаптера `cursor`.

## Инварианты

- `docs/human/adapters/cursor/**` MUST рассматриваться как derived-слой.
- `docs/human/adapters/cursor/**` MUST синхронизироваться с `docs/spec/**`.
- IF возникает конфликт с source-слоем THEN приоритет MUST быть у `docs/spec/**`.

## Source mapping

- Product source: `docs/spec/**`
- Adapter package source: `docs/adapters/cursor/**`
- Runtime directory: `.cursor/**`
- Human runtime projection directory: `cursor/**`
- Runtime rules source: `docs/adapters/cursor/runtime/.cursor/rules/README.md`
- Runtime prompts source: `docs/adapters/cursor/runtime/.cursor/prompts/README.md`

## Карта human-проекции target-адаптера

- [runtime/cursor/rules/README.md](runtime/cursor/rules/README.md)
- [runtime/cursor/prompts/README.md](runtime/cursor/prompts/README.md)

## Метаданные генерации

- Manifest: `aagf-docs`
- Version: `0.1.0`
- Target: `cursor`
- Sections: `5`
- Rules: `70`
- Prompts: `3`
