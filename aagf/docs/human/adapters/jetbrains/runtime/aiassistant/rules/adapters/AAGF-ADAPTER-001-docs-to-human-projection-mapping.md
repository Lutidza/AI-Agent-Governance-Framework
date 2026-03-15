<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/adapters/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/adapters/AAGF-ADAPTER-001-docs-to-human-projection-mapping.md -->

# AAGF-ADAPTER-001 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/adapters/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/adapters/AAGF-ADAPTER-001-docs-to-human-projection-mapping.md`
- Runtime compatibility: `.aiassistant/rules/adapters/AAGF-ADAPTER-001-docs-to-human-projection-mapping.md`
- Human projection path: `runtime/aiassistant/rules/adapters/AAGF-ADAPTER-001-docs-to-human-projection-mapping.md`

## Контекст

- Section: `adapters` / Adapters
- Rule ID: `AAGF-ADAPTER-001`
- Rule title: Docs -> Human Projection Mapping
- Intent: Формализовать правила преобразования spec-содержимого в человеко-читаемые документы.

## Нормативные правила
- Генератор MUST строить aagf/docs/human/** из YAML-спеков и manifest-конфигурации.
- Генератор MUST строить aagf/docs/human/adapters/<target>/** как человеко-читаемую проекцию target-runtime adapter-слоя.
- Каждый generated документ MUST содержать ссылку на source.
- Human-проекция MUST NOT добавлять нормативные правила, отсутствующие в source.

## Условия IF -> THEN
- IF В human-слое обнаружен новый нормативный пункт без source THEN Пункт MUST быть удален или перенесен в source.
- IF Source-файл переименован THEN Generator mapping MUST быть обновлен в manifest до следующей генерации.

## Проверки
- Проверить валидность manifest и section specs.
- Проверить корректность ссылок source -> derived.
- Проверить наличие human-проекций для каждого target из manifest.
