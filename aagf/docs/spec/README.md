# docs/spec — machine-readable source layer

Этот каталог является первичным источником правил docs-контура.

## Правила слоя

- `aagf/docs/spec/**` MUST содержать машинно-читаемые спецификации (`yaml`, `json`, схемы, идентификаторы правил).
- Все нормативные изменения MUST вноситься сначала в `aagf/docs/spec/**`.
- `aagf/docs/human/**` и `aagf/docs/adapters/**` MUST синхронизироваться на основе `aagf/docs/spec/**`.
- Секционные спецификации MUST храниться в YAML-файлах разделов (`core/policies.yaml`, `workflows/workflows.yaml` и т.д.).
- Проектный bootstrap-контур MUST храниться в `aagf/docs/spec/project/**` и MUST включать `context.yaml`, `stack-detection.yaml`, `enabled-packs.yaml`, `overrides.yaml`, `profile.lock.yaml`.

## Карта разделов

- [manifests/README.md](manifests/README.md)
- [core/README.md](core/README.md)
- [stacks/README.md](stacks/README.md)
- [workflows/README.md](workflows/README.md)
- [roles/README.md](roles/README.md)
- [adapters/README.md](adapters/README.md)
- `project/context.yaml`
- `project/stack-detection.yaml`
- `project/enabled-packs.yaml`
- `project/overrides.yaml`
- `project/profile.lock.yaml`
- [schemas/README.md](schemas/README.md)
