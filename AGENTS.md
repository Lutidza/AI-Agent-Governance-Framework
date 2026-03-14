# Контракт агентов контура разработки AAGF

Этот файл задает обязательные операционные правила для агентов, которые развивают framework в текущем репозитории.

## Область действия

- Корневые `README.md` и `AGENTS.md` MUST применяться как инструкции для разработки текущего репозитория.
- `initial-data/**` MUST рассматриваться как reference-контур.
- `aagf/docs/**` MUST рассматриваться как продуктовый docs-контур.
- `aagf/docs/README.md` и `aagf/docs/AGENTS.md` MUST NOT трактоваться как инструкции для meta-контура разработки.

## Контуры изменений

Перед любой правкой агент MUST определить целевой контур:

1. `root/meta` — правила и архитектура разработки AAGF.
2. `initial-data` — входные референсные материалы.
3. `aagf-kit` — переносимый набор `aagf/{docs,tools,package.json}`.
4. `aagf/docs/spec` — machine-readable source layer docs-контура.
5. `aagf/docs/human` — human-readable derived layer docs-контура.
6. `aagf/docs/adapters` — generated adapter layer docs-контура.
7. `runtime` — активные IDE-слои `.aiassistant/**`, `.cursor/**` целевого проекта.

IF изменение затрагивает более одного контура THEN агент MUST получить явное подтверждение пользователя.

## Governance source of truth

- Агент MUST рассматривать `aagf/docs/spec/**` как первичный источник истины docs-контура.
- Агент MUST рассматривать `aagf/docs/human/**` и `aagf/docs/adapters/**` как производные представления.
- IF производный артефакт расходится с source-слоем THEN агент MUST зафиксировать drift и синхронизировать артефакт.

## Модель модульных правил

- Агент MUST вести source-правила в `aagf/docs/spec/**` модульно (раздельные rule-файлы по назначению), а не в едином монолите.
- Каждый модуль правила MUST иметь стабильный `rule_id` и проверяемые условия применения.
- Агент MUST поддерживать индекс/карту правил для generated-слоев (`human` и `adapters`) как навигационный и контрольный артефакт.
- IF требуется selective enable/disable правил THEN агент MUST использовать `aagf/docs/spec/project/enabled-packs.yaml` и `aagf/docs/spec/project/overrides.yaml`.
- Для runtime-адаптеров агент MAY агрегировать правила в один файл, если это ограничение target-IDE, но source-модульность MUST NOT теряться.

## Rule precedence

- Для `root/meta` MUST применяться порядок:
  1. `kit.manifest.yaml` и `core/**/*.yaml`
  2. `README.md`
  3. `AGENTS.md`
- Для `aagf/docs` MUST применяться порядок:
  1. `aagf/docs/spec/**`
  2. `aagf/docs/README.md`
  3. `aagf/docs/AGENTS.md`
  4. `aagf/docs/human/**`
  5. `aagf/docs/adapters/**`
- IF обнаружен межконтурный конфликт (`root/meta` vs `aagf/docs`) THEN агент MUST остановить правки и запросить решение владельца репозитория.

## Declarative-first и AI-only

- Агент MUST поддерживать `.md` и IDE-артефакты как синхронизированные представления policy-модели.
- Ручное редактирование generated-слоев (`aagf/docs/human/**`, `aagf/docs/adapters/**`) MUST NOT быть штатным процессом.
- IF пользователь явно запросил исключение THEN агент MAY внести ручную правку с последующей синхронизацией в `aagf/docs/spec/**`.

## Lifecycle и контроль изменений

- Для значимых изменений агент MUST обновлять changelog/compatibility notes.
- Каждое значимое изменение MUST иметь тип: `breaking`, `non-breaking`, `editorial`.
- IF изменение влияет на структуру policy-слоя или precedence THEN агент MUST добавить migration notes.

## Правила работы по запросу

- Агент MUST изменять только файлы, согласованные пользователем в текущем шаге.
- Агент MUST NOT создавать новые разделы без явного запроса.
- Агент MUST NOT удалять обязательные правила без явного запроса.
- После правок агент MUST проверить и синхронизировать перекрестные ссылки.

## Validation и drift control

- Перед завершением правок агент MUST проверить:
  1. консистентность терминов между `README.md`, `AGENTS.md`, `aagf/docs/**`;
  2. отсутствие конфликтов с rule precedence;
  3. актуальность ссылок и путей;
  4. соответствие `aagf/docs/human/**` и `aagf/docs/adapters/**` source-слою `aagf/docs/spec/**`.
- IF обнаружен drift THEN изменение MUST NOT считаться завершенным до синхронизации.

## Язык и именование

- Имена файлов и папок MUST быть на английском языке.
- Содержимое документации MUST быть на русском языке, если пользователь не указал иное.
- Ссылки внутри репозитория MUST быть относительными.
- Абсолютные локальные пути MUST NOT использоваться.
