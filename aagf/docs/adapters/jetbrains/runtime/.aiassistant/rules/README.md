<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml -->

# rules

Здесь должны храниться переносимые rule-артефакты docs-контура для target `jetbrains`.

## Обязательные условия

- Rule-файлы MUST опираться на `docs/spec/**`.
- Rule-файлы MUST использовать нормативные маркеры `MUST`, `MUST NOT`, `MAY`.
- Rule-файлы MUST быть совместимы с runtime-каталогом `.aiassistant/rules/**`.
- IF rule конфликтует с source-слоем THEN конфликт MUST быть устранен через изменение `docs/spec/**`.

## Сводный индекс правил по source-спецификациям
### core
- `AAGF-CORE-001` Declarative-First Source of Truth
- RULE: aagf/docs/spec/** MUST рассматриваться как primary source of truth.
- RULE: aagf/docs/human/** и aagf/docs/adapters/** MUST рассматриваться как derived layers.
- RULE: Прямые изменения в derived layers MUST NOT считаться завершенными без синхронизации source-слоя.
- IF Изменение внесено только в aagf/docs/human/** или aagf/docs/adapters/** THEN Агент MUST внести эквивалентное изменение в aagf/docs/spec/** в том же шаге.
- IF Выявлен конфликт между source и derived слоями THEN Приоритет MUST быть у aagf/docs/spec/**.
- `AAGF-CORE-002` Контурная изоляция
- RULE: Агент MUST явно определять целевой контур до начала правок.
- RULE: Правила root/meta и docs MUST NOT смешиваться в одном действии без явного запроса пользователя.
- RULE: Межконтурные изменения MAY выполняться только с явным подтверждением.
- IF Задача затрагивает более одного контура THEN Агент MUST запросить подтверждение пользователя до внесения правок.
- IF Контур задачи не определен THEN Агент MUST остановиться и запросить уточнение.
- `AAGF-CORE-003` Stack-Profiled Commenting Contract
- RULE: Комментарии и метаданные версий MUST оформляться по активному stack doc profile из aagf/docs/spec/stacks/comment-doc-profiles.yaml.
- RULE: Для измененных публичных контрактов и нетривиальной логики MUST быть комментарий, который объясняет назначение, входы, выходы, ошибки и ограничения.
- RULE: Для измененных файлов MUST фиксироваться метаданные трассируемости (file, version, edited_at) в формате, определенном stack doc profile.
- RULE: Комментарии MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.
- RULE: Устаревшие, противоречащие коду комментарии и неконтролируемые TODO/FIXME MUST NOT оставаться в измененных участках.
- IF Активный stack doc profile не определен в контексте проекта THEN Агент MUST остановить переход в done и запросить явное подтверждение/выбор профиля.
- IF Изменена логика файла или публичный контракт THEN Агент MUST обновить комментарии и метаданные версии в том же изменении.
- IF Stack doc profile требует обязательные semantic-теги THEN Агент MUST использовать эквиваленты params/returns/throws/remarks в нативном синтаксисе языка.
### stacks
- `AAGF-STACK-001` Stack Pack как заменяемый модуль
- RULE: Stack-spec MUST описывать только технологические требования конкретного стека.
- RULE: Stack-spec MUST NOT изменять core-инварианты governance-системы.
- RULE: Замена stack pack MAY выполняться без изменений в core/**.
- IF Требуется изменить правила тестирования для конкретного стека THEN Изменение MUST вноситься в stack-spec, а не в core-политики.
- IF Stack-spec вводит правило, конфликтующее с core THEN Конфликт MUST быть эскалирован и разрешен через rule precedence.
- `AAGF-STACK-002` Документирование стековых допущений
- RULE: Stack-spec MUST включать ограничения по зависимостям и версионированию.
- RULE: Stack-spec MUST включать требования к тестированию и quality gates.
- RULE: Stack-spec MUST использовать единый формат rule IDs и IF -> THEN условий.
- IF В stack-spec добавлена новая зависимость THEN MUST быть добавлены проверка совместимости и migration notes.
- IF Stack-изменение влияет на CI/CD THEN Изменение MUST быть отмечено как risk-critical и требовать подтверждения.
### workflows
- `AAGF-WF-001` Plan-First Change Workflow
- RULE: Для нетривиальной задачи агент MUST выполнить этапы analyze -> plan -> implement -> verify.
- RULE: Этап implement MUST NOT начинаться до фиксации плана.
- RULE: Handoff MUST содержать измененные файлы, риски и проверки.
- IF Задача затрагивает архитектуру или несколько подсистем THEN Агент MUST использовать reasoning-intensive профиль и детальный план.
- IF На этапе verify обнаружен regression risk THEN Агент MUST остановить продвижение и предложить корректирующий план.
- `AAGF-WF-002` Spec-Driven Documentation Workflow
- RULE: Нормативные изменения MUST вноситься сначала в aagf/docs/spec/**.
- RULE: После изменений MUST выполняться docs:generate и docs:check.
- RULE: Drift между source и derived слоями MUST NOT оставаться в репозитории.
- IF Изменение внесено только в generated файл THEN Агент MUST перенести изменение в соответствующий spec-файл и перегенерировать слой.
- IF docs:check возвращает drift THEN Изменение MUST считаться незавершенным до устранения drift.
- `AAGF-WF-BOOTSTRAP` AAGF Bootstrap Integration Workflow
- RULE: Workflow MUST выполняться по фазам Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock.
- RULE: Install MUST подключать aagf/ в проект и MUST заменять root AGENTS.md install-шаблоном `aagf/docs/install/AGENTS.md` через явный dry-run/apply.
- RULE: Detect MUST выполняться через MCP tool `detect_stack_deep` и MUST публиковать `detect-started` с `project-root`, `detector-id`, `session-id`.
- RULE: Detect MUST формировать глубокий `stack-context` по уровням (`os/server/runtime/languages/frameworks/libraries/packages/databases/cache/messaging/ci/deploy`) с `id`, `version`, `confidence`, `evidence`, `source`.
- RULE: Confirm MUST требовать явное действие `confirm` или `edit`; bootstrap MUST NOT продолжаться без прохождения confirm/edit gate.
- RULE: IF выбран `edit` THEN правки MUST сохраняться в `aagf/docs/spec/project/stack-overrides.yaml` и MUST быть применены к итоговому `stack-context` перед Lock.
- RULE: Compose MUST формировать enabled packs и overrides до фазы Generate.
- RULE: Generate MUST собирать aagf/docs/human/** и aagf/docs/adapters/** только из aagf/docs/spec/**.
- RULE: Sync MUST выполняться только после явного подтверждения пользователя и только через target-aware sync-процесс.
- RULE: Lock MUST фиксировать итоговую конфигурацию проекта в `aagf/docs/spec/project/profile.lock.yaml` и MUST записывать `context.yaml`/`profile.lock.yaml` только после confirm/edit.
- RULE: Runtime rules/prompts/workflows MUST использовать подтвержденный `aagf/docs/spec/project/stack-context.yaml` как входной контекст.
- IF Detect вернул unknown или low-confidence элементы THEN Агент MUST опубликовать structured summary (`stack.*`, `unknown-levels`, `low-confidence`) и MUST запросить explicit confirm/edit.
- IF Detection action (`confirm`/`edit`) отсутствует THEN Bootstrap MUST остановиться на phase Confirm без перехода в Compose/Generate/Lock.
- IF Специалист выбрал edit THEN Агент MUST сохранить правки в stack-overrides и MUST пересчитать итоговый stack-context до lock.
- IF Запрошена синхронизация runtime-контуров THEN Агент MUST сначала выполнить dry-run (`docs:sync:check`) и MUST применять sync только после явного подтверждения.
- IF Runtime-адаптеры не имеют подтвержденного stack-context THEN Агент MUST NOT использовать не подтвержденный профиль как active для rules/prompts/workflows.
### roles
- `AAGF-ROLE-001` Orchestrator (Дирижер)
- RULE: Orchestrator MUST определять рабочий контур и целевой workflow до старта исполнения.
- RULE: Orchestrator MUST назначать bounded scope для каждой подроли.
- RULE: Orchestrator MUST NOT делегировать критические решения без финальной верификации.
- IF В задаче участвуют несколько ролей THEN Orchestrator MUST выпустить явный handoff protocol для каждой роли.
- IF Обнаружен конфликт между результатами ролей THEN Orchestrator MUST остановить merge и инициировать reconciliation шаг.
- `AAGF-ROLE-002` Implementer (Исполнитель)
- RULE: Implementer MUST работать только с файлами в согласованном scope.
- RULE: Implementer MUST передавать handoff после каждого значимого шага.
- RULE: Implementer MUST NOT менять policy/preference без запроса orchestrator или пользователя.
- IF Обнаружена неопределенность в требованиях THEN Implementer MUST остановиться и запросить уточнение.
- IF Изменение затрагивает внешний контур THEN Implementer MUST запросить эскалацию у Orchestrator.
### adapters
- `AAGF-ADAPTER-001` Docs -> Human Projection Mapping
- RULE: Генератор MUST строить aagf/docs/human/** из YAML-спеков и manifest-конфигурации.
- RULE: Генератор MUST строить aagf/docs/human/adapters/<target>/** как человеко-читаемую проекцию target-runtime adapter-слоя.
- RULE: Каждый generated документ MUST содержать ссылку на source.
- RULE: Human-проекция MUST NOT добавлять нормативные правила, отсутствующие в source.
- IF В human-слое обнаружен новый нормативный пункт без source THEN Пункт MUST быть удален или перенесен в source.
- IF Source-файл переименован THEN Generator mapping MUST быть обновлен в manifest до следующей генерации.
- `AAGF-ADAPTER-002` Docs -> Multi-Target IDE Projection Mapping
- RULE: aagf/docs/adapters/jetbrains/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.aiassistant`.
- RULE: aagf/docs/adapters/cursor/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.cursor`.
- RULE: Multi-target adapter-проекции MUST использовать только переносимые настройки без machine-specific данных.
- RULE: Runtime rules/prompts/workflows MUST использовать подтвержденный `aagf/docs/spec/project/stack-context.yaml` как первичный входной контекст.
- RULE: Runtime rules/prompts/workflows MUST учитывать `detection.status` и `stack_context_ref` из `context.yaml`/`profile.lock.yaml`.
- RULE: Синхронизация в активные runtime-контуры MUST выполняться только через target-aware sync (`docs:sync`) после явного подтверждения пользователя.
- IF Workflow spec содержит prompts THEN Prompt-блок MUST быть включен в prompts-проекции каждого поддерживаемого target.
- IF Adapter-проекция конфликтует с source THEN Source MUST иметь приоритет, а adapter MUST быть перегенерирован.
- IF stack-context отсутствует или имеет статус pending-confirm THEN Runtime-проекция MUST требовать confirm/edit и MUST NOT считать профиль подтвержденным.
- IF Запрошена синхронизация в `/.aiassistant/**` или `/.cursor/**` THEN Агент MUST сначала выполнить `docs:sync:check`, показать изменения и только после подтверждения выполнять `docs:sync`.
