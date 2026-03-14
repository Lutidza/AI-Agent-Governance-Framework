<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml -->

# rules

Здесь должны храниться переносимые rule-артефакты docs-контура для target `cursor`.

## Обязательные условия

- Rule-файлы MUST опираться на `docs/spec/**`.
- Rule-файлы MUST использовать нормативные маркеры `MUST`, `MUST NOT`, `MAY`.
- Rule-файлы MUST быть совместимы с runtime-каталогом `.cursor/rules/**`.
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
- `AAGF-CORE-003` Contract-First Code Comments
- RULE: Публичные функции, методы и API-контракты MUST иметь структурированный комментарий в нативном формате языка (JSDoc/TypeDoc/docstring/аналог).
- RULE: Комментарий MUST описывать назначение, входы, выходы, побочные эффекты и ограничения.
- RULE: Комментарий MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.
- IF Язык поддерживает теги параметров и возврата THEN Комментарий MUST включать эквиваленты @param/@returns/@throws.
- IF Изменена нетривиальная логика без изменения внешнего API THEN Агент MUST добавить краткий поясняющий комментарий о причине изменения рядом с блоком.
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
- RULE: Install MUST подключать aagf/ в проект и MUST применять root AGENTS.md только через merge-предложение без неявного overwrite.
- RULE: Detect MUST выполнять offline-детекцию стека и контекста проекта по артефактам репозитория и MUST вычислять confidence score.
- RULE: Confirm MUST применять пороги: confidence >= 0.85 -> auto; 0.60-0.84 -> explicit confirm; < 0.60 -> unknown profile и ручной выбор.
- RULE: Compose MUST формировать enabled packs и overrides до фазы Generate.
- RULE: Generate MUST собирать aagf/docs/human/** и aagf/docs/adapters/** только из aagf/docs/spec/**.
- RULE: Sync MUST выполняться только после явного подтверждения пользователя и только через target-aware sync-процесс.
- RULE: Lock MUST фиксировать итоговую конфигурацию проекта в aagf/docs/spec/project/profile.lock.yaml.
- IF confidence находится в диапазоне 0.60-0.84 THEN Агент MUST остановиться на phase gate и MUST запросить явное подтверждение перед Generate/Sync.
- IF confidence ниже 0.60 THEN Агент MUST установить статус unknown и MUST NOT выполнять auto-apply профиля.
- IF Запрошена синхронизация runtime-контуров THEN Агент MUST сначала выполнить dry-run (`docs:sync:check`) и MUST применять sync только после явного подтверждения.
- IF Требуется изменение root AGENTS.md THEN Агент MUST сформировать diff/merge-предложение и MUST NOT перезаписывать файл автоматически.
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
- RULE: Синхронизация в активные runtime-контуры MUST выполняться только через target-aware sync (`docs:sync`) после явного подтверждения пользователя.
- IF Workflow spec содержит prompts THEN Prompt-блок MUST быть включен в prompts-проекции каждого поддерживаемого target.
- IF Adapter-проекция конфликтует с source THEN Source MUST иметь приоритет, а adapter MUST быть перегенерирован.
- IF Запрошена синхронизация в `/.aiassistant/**` или `/.cursor/**` THEN Агент MUST сначала выполнить `docs:sync:check`, показать изменения и только после подтверждения выполнять `docs:sync`.
