<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/adapters/jetbrains/** -->

# adapters/jetbrains (human projection)

Этот документ описывает человеко-читаемую проекцию target-адаптера `jetbrains`.

## Инварианты

- `docs/human/adapters/jetbrains/**` MUST рассматриваться как derived-слой.
- `docs/human/adapters/jetbrains/**` MUST синхронизироваться с `docs/spec/**`.
- IF возникает конфликт с source-слоем THEN приоритет MUST быть у `docs/spec/**`.

## Source mapping

- Product source: `docs/spec/**`
- Adapter package source: `docs/adapters/jetbrains/**`
- Runtime directory: `.aiassistant/**`
- Human runtime projection directory: `aiassistant/**`
- Runtime rules source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/README.md`
- Runtime prompts source: `docs/adapters/jetbrains/runtime/.aiassistant/prompts/README.md`

## Карта human-проекции target-адаптера

- [runtime/aiassistant/rules/README.md](runtime/aiassistant/rules/README.md)
- [runtime/aiassistant/prompts/README.md](runtime/aiassistant/prompts/README.md)

## Метаданные генерации

- Manifest: `aagf-docs`
- Version: `0.1.0`
- Target: `jetbrains`
- Sections: `5`
- Rules: `43`
- Prompts: `3`
