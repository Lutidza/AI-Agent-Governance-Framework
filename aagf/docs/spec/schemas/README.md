# schemas

Здесь находятся схемы валидации machine-readable файлов.

- Все ключевые спецификации MUST валидироваться по схемам из этого каталога.
- `docs-manifest.schema.json` MUST использоваться для валидации `docs/spec/manifests/docs.manifest.yaml`.
- `section-spec.schema.json` MUST использоваться для секций в монолитном формате (`section + entries[]`).
- `rule-module.schema.json` MUST использоваться для валидации модульных source-правил.
- `rules-index.schema.json` MUST использоваться для валидации индексов модульных секций (`mode: modular`).
- `stack-context.schema.json` MUST использоваться для валидации глубокого MCP stack-context.
- `stack-overrides.schema.json` MUST использоваться для валидации правок стека (confirm/edit phase).
- `command-catalog.schema.json` MUST использоваться для валидации `docs/spec/project/commands.catalog.yaml`.
