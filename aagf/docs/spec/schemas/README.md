# schemas

Здесь находятся схемы валидации machine-readable файлов.

- Все ключевые спецификации MUST валидироваться по схемам из этого каталога.
- `docs-manifest.schema.json` MUST использоваться для валидации `docs/spec/manifests/docs.manifest.yaml`.
- `section-spec.schema.json` MUST использоваться для секций в монолитном формате (`section + entries[]`).
- `rule-module.schema.json` MUST использоваться для валидации модульных source-правил.
- `rules-index.schema.json` MUST использоваться для валидации индексов модульных секций (`mode: modular`).
