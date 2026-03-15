# Checklist: Rules Generation Optimization And Naming

Этот чеклист фиксирует план оптимизации генерации правил для IDE и приведения процесса к стабильной, модульной и поддерживаемой модели.

## 1. Зафиксировать контракт нейминга rule-файлов

- [x] Добавить в schema поле `entry.file_slug` с валидацией формата (`kebab-case`, только `[a-z0-9-]`).
- [x] Зафиксировать единый формат имени файла: `<rule-id>-<file-slug>.<ext>`.
- [x] Обновить генератор путей rule-entry, чтобы имя файла строилось из `id + file_slug`, а не только из `id`.
- [x] Обновить индексные ссылки в `rules/README.md` под новый формат.
- [x] Добавить migration notes по переименованию файлов.

Критерий готовности:
- [x] Новые имена файлов читаемы в IDE и однозначно сопоставляются с `rule_id`.

## 2. Перевести source-слой на полную модульность

- [x] Перевести `stacks`, `workflows`, `roles`, `adapters` на формат `rules.index.yaml` + `rules/*.yaml`.
- [x] Оставить монолитные section-файлы только как временные артефакты миграции, затем удалить.
- [x] Добавить проверку, что каждая секция использует modular mode.
- [x] Добавить проверку, что каждый `rules.index.yaml` покрывает все rule-модули секции.

Критерий готовности:
- [x] Во всех rule-секциях source-уровня используются отдельные rule-файлы.

## 3. Ввести target-aware профиль генерации (JetBrains/Cursor)

- [x] В manifest/schema добавить target-параметры формата entry-файлов (`ext`, `index path`, опции рендера).
- [x] Для `jetbrains` оставить runtime-правила в `.md`.
- [x] Для `cursor` генерировать правила в `.mdc` и добавить требуемый frontmatter.
- [x] В генераторе разделить обработку target-специфичных форматов.

Критерий готовности:
- [x] JetBrains и Cursor получают корректные runtime-артефакты по документации каждой IDE.

## 4. Разделить и упростить шаблоны генерации

- [x] Разделить шаблоны по target: `templates/jetbrains/*`, `templates/cursor/*`.
- [x] Убрать общие runtime-шаблоны, которые не учитывают различия target.
- [x] Убрать из derived-шаблонов нормативные блоки, не привязанные к source-правилам.
- [x] Оставить в `rules/README.md` только индекс/навигацию и source traceability.

Критерий готовности:
- [x] В generated runtime/human слоях нет лишних нормативных дублей вне source-правил.

## 5. Усилить drift-control и sync-механику

- [x] Добавить в sync-план операцию `delete/prune` для устаревших runtime-файлов.
- [x] Добавить strict drift-check: `missing`, `changed`, `extra`.
- [x] Включить dry-run отчет с явным списком `create/update/delete`.
- [x] Обновить docs:sync:check и docs:check так, чтобы лишние файлы считались drift.

Критерий готовности:
- [x] После sync в runtime нет устаревших монолитных и legacy-файлов.

## 6. Добавить тесты на генерацию правил и кроссплатформенность

- [x] Добавить snapshot/contract тесты для имен и путей rule-файлов по каждому target.
- [x] Добавить тесты на рендер `rules/README` и корректность ссылок.
- [x] Добавить тесты для `.mdc` frontmatter на Cursor target.
- [x] Добавить тесты на detection/validation коллизий (`duplicate id`, `duplicate slug`).
- [x] Добавить CI-проверки для Windows и Ubuntu (path separators, одинаковый output).

Критерий готовности:
- [x] Любая регрессия в структуре и нейминге rules-файлов ловится автоматическими тестами.

## Финальная приемка

- [x] `docs:validate` проходит.
- [x] `docs:generate` проходит.
- [x] `docs:check` проходит без drift.
- [x] `docs:sync:check` показывает только ожидаемые изменения.
- [x] Runtime-структуры в `.aiassistant` и `.cursor` соответствуют целевому контракту.
- [x] Документация обновлена и отражает финальные naming rules и migration path.
