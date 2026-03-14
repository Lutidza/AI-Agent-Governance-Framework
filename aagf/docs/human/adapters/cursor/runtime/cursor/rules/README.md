<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/adapters/cursor/runtime/.cursor/rules/README.md -->

# rules (human projection)

Этот документ является человеко-читаемой проекцией target-runtime rules для `cursor`.

## Source mapping

- Product source: `docs/spec/**`
- Adapter runtime source: `docs/adapters/cursor/runtime/.cursor/rules/README.md`
- Runtime compatibility: `.cursor/rules/**`
- Human projection path: `runtime/cursor/rules/**`

## Обязательные условия

- Правила MUST извлекаться из `docs/spec/**`.
- Правила MUST NOT вводить новые нормативные пункты, отсутствующие в source-слое.
- IF runtime rules расходятся с source-слоем THEN приоритет MUST быть у `docs/spec/**`.

## Карта правил по секциям
### Core (`core`)
#### AAGF-CORE-001 - Declarative-First Source of Truth

Назначение: Все нормативные изменения должны начинаться в machine-readable слое.

Ключевые правила:
- aagf/docs/spec/** MUST рассматриваться как primary source of truth.
- aagf/docs/human/** и aagf/docs/adapters/** MUST рассматриваться как derived layers.
- Прямые изменения в derived layers MUST NOT считаться завершенными без синхронизации source-слоя.

Условия (IF -> THEN):
- IF Изменение внесено только в aagf/docs/human/** или aagf/docs/adapters/** THEN Агент MUST внести эквивалентное изменение в aagf/docs/spec/** в том же шаге.
- IF Выявлен конфликт между source и derived слоями THEN Приоритет MUST быть у aagf/docs/spec/**.

Проверки:
- Проверить, что изменение зафиксировано в aagf/docs/spec/**.
- Проверить, что docs:generate не создает неожиданный drift.
#### AAGF-CORE-002 - Контурная изоляция

Назначение: Слои root/meta, docs и runtime adapters должны оставаться разделенными.

Ключевые правила:
- Агент MUST явно определять целевой контур до начала правок.
- Правила root/meta и docs MUST NOT смешиваться в одном действии без явного запроса пользователя.
- Межконтурные изменения MAY выполняться только с явным подтверждением.

Условия (IF -> THEN):
- IF Задача затрагивает более одного контура THEN Агент MUST запросить подтверждение пользователя до внесения правок.
- IF Контур задачи не определен THEN Агент MUST остановиться и запросить уточнение.

Проверки:
- Проверить список измененных файлов и их принадлежность контуру.
- Проверить, что в handoff указан затронутый контур.
#### AAGF-CORE-003 - Contract-First Code Comments

Назначение: Обеспечить единый стандарт комментариев для публичных контрактов и нетривиальной логики.

Ключевые правила:
- Публичные функции, методы и API-контракты MUST иметь структурированный комментарий в нативном формате языка (JSDoc/TypeDoc/docstring/аналог).
- Комментарий MUST описывать назначение, входы, выходы, побочные эффекты и ограничения.
- Комментарий MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.

Условия (IF -> THEN):
- IF Язык поддерживает теги параметров и возврата THEN Комментарий MUST включать эквиваленты @param/@returns/@throws.
- IF Изменена нетривиальная логика без изменения внешнего API THEN Агент MUST добавить краткий поясняющий комментарий о причине изменения рядом с блоком.

Проверки:
- Проверить, что для измененных публичных контрактов есть структурированные комментарии.
- Проверить отсутствие placeholder-комментариев и устаревших описаний после правок.
### Stacks (`stacks`)
#### AAGF-STACK-001 - Stack Pack как заменяемый модуль

Назначение: Стековый блок должен заменяться без изменения core-политик.

Ключевые правила:
- Stack-spec MUST описывать только технологические требования конкретного стека.
- Stack-spec MUST NOT изменять core-инварианты governance-системы.
- Замена stack pack MAY выполняться без изменений в core/**.

Условия (IF -> THEN):
- IF Требуется изменить правила тестирования для конкретного стека THEN Изменение MUST вноситься в stack-spec, а не в core-политики.
- IF Stack-spec вводит правило, конфликтующее с core THEN Конфликт MUST быть эскалирован и разрешен через rule precedence.

Проверки:
- Проверить, что изменения ограничены stack-слоем.
- Проверить, что core-политики остаются неизменными.
#### AAGF-STACK-002 - Документирование стековых допущений

Назначение: Для каждого стека должны быть формализованы ограничения, риски и критерии валидации.

Ключевые правила:
- Stack-spec MUST включать ограничения по зависимостям и версионированию.
- Stack-spec MUST включать требования к тестированию и quality gates.
- Stack-spec MUST использовать единый формат rule IDs и IF -> THEN условий.

Условия (IF -> THEN):
- IF В stack-spec добавлена новая зависимость THEN MUST быть добавлены проверка совместимости и migration notes.
- IF Stack-изменение влияет на CI/CD THEN Изменение MUST быть отмечено как risk-critical и требовать подтверждения.

Проверки:
- Проверить наличие rule IDs, checks и risk notes.
- Проверить согласованность stack-spec с workflow и role спецификациями.
### Workflows (`workflows`)
#### AAGF-WF-001 - Plan-First Change Workflow

Назначение: Любое нетривиальное изменение должно проходить анализ, план и контролируемое выполнение.

Ключевые правила:
- Для нетривиальной задачи агент MUST выполнить этапы analyze -> plan -> implement -> verify.
- Этап implement MUST NOT начинаться до фиксации плана.
- Handoff MUST содержать измененные файлы, риски и проверки.

Условия (IF -> THEN):
- IF Задача затрагивает архитектуру или несколько подсистем THEN Агент MUST использовать reasoning-intensive профиль и детальный план.
- IF На этапе verify обнаружен regression risk THEN Агент MUST остановить продвижение и предложить корректирующий план.

Проверки:
- Проверить наличие плана перед код-изменениями.
- Проверить полноту handoff и верификации.
#### AAGF-WF-002 - Spec-Driven Documentation Workflow

Назначение: Любое изменение документации должно проходить через aagf/docs/spec с обязательной синхронизацией производных слоев.

Ключевые правила:
- Нормативные изменения MUST вноситься сначала в aagf/docs/spec/**.
- После изменений MUST выполняться docs:generate и docs:check.
- Drift между source и derived слоями MUST NOT оставаться в репозитории.

Условия (IF -> THEN):
- IF Изменение внесено только в generated файл THEN Агент MUST перенести изменение в соответствующий spec-файл и перегенерировать слой.
- IF docs:check возвращает drift THEN Изменение MUST считаться незавершенным до устранения drift.

Проверки:
- Проверить успех команд docs:validate, docs:generate, docs:check.
- Проверить, что generated файлы соответствуют обновленному source.
#### AAGF-WF-BOOTSTRAP - AAGF Bootstrap Integration Workflow

Назначение: Интеграция AAGF в новый или существующий проект должна выполняться как управляемый протокол с явными фазами, confirm-gates и lock-конфигурацией.

Ключевые правила:
- Workflow MUST выполняться по фазам Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock.
- Install MUST подключать aagf/ в проект и MUST применять root AGENTS.md только через merge-предложение без неявного overwrite.
- Detect MUST выполнять offline-детекцию стека и контекста проекта по артефактам репозитория и MUST вычислять confidence score.
- Confirm MUST применять пороги: confidence >= 0.85 -> auto; 0.60-0.84 -> explicit confirm; < 0.60 -> unknown profile и ручной выбор.
- Compose MUST формировать enabled packs и overrides до фазы Generate.
- Generate MUST собирать aagf/docs/human/** и aagf/docs/adapters/** только из aagf/docs/spec/**.
- Sync MUST выполняться только после явного подтверждения пользователя и только через target-aware sync-процесс.
- Lock MUST фиксировать итоговую конфигурацию проекта в aagf/docs/spec/project/profile.lock.yaml.

Условия (IF -> THEN):
- IF confidence находится в диапазоне 0.60-0.84 THEN Агент MUST остановиться на phase gate и MUST запросить явное подтверждение перед Generate/Sync.
- IF confidence ниже 0.60 THEN Агент MUST установить статус unknown и MUST NOT выполнять auto-apply профиля.
- IF Запрошена синхронизация runtime-контуров THEN Агент MUST сначала выполнить dry-run (`docs:sync:check`) и MUST применять sync только после явного подтверждения.
- IF Требуется изменение root AGENTS.md THEN Агент MUST сформировать diff/merge-предложение и MUST NOT перезаписывать файл автоматически.

Проверки:
- Проверить наличие aagf/docs/spec/project/context.yaml, stack-detection.yaml, enabled-packs.yaml, overrides.yaml и profile.lock.yaml.
- Проверить, что detect-результат содержит evidence, confidence и decision.
- Проверить, что Generate выполняется только из aagf/docs/spec/** без ручных правок derived-слоев.
- Проверить, что runtime sync прошел через confirm gate.
- Проверить, что lock-файл зафиксировал выбранный профиль и включенные packs.
### Roles (`roles`)
#### AAGF-ROLE-001 - Orchestrator (Дирижер)

Назначение: Управляет задачей, распределяет шаги между ролями и принимает итоговый handoff.

Ключевые правила:
- Orchestrator MUST определять рабочий контур и целевой workflow до старта исполнения.
- Orchestrator MUST назначать bounded scope для каждой подроли.
- Orchestrator MUST NOT делегировать критические решения без финальной верификации.

Условия (IF -> THEN):
- IF В задаче участвуют несколько ролей THEN Orchestrator MUST выпустить явный handoff protocol для каждой роли.
- IF Обнаружен конфликт между результатами ролей THEN Orchestrator MUST остановить merge и инициировать reconciliation шаг.

Проверки:
- Проверить полноту handoff от каждой роли.
- Проверить, что финальный результат соответствует исходному плану.
#### AAGF-ROLE-002 - Implementer (Исполнитель)

Назначение: Вносит изменения строго в пределах согласованного scope и workflow.

Ключевые правила:
- Implementer MUST работать только с файлами в согласованном scope.
- Implementer MUST передавать handoff после каждого значимого шага.
- Implementer MUST NOT менять policy/preference без запроса orchestrator или пользователя.

Условия (IF -> THEN):
- IF Обнаружена неопределенность в требованиях THEN Implementer MUST остановиться и запросить уточнение.
- IF Изменение затрагивает внешний контур THEN Implementer MUST запросить эскалацию у Orchestrator.

Проверки:
- Проверить, что изменения ограничены scope.
- Проверить, что handoff содержит риски и рекомендации по проверке.
### Adapters (`adapters`)
#### AAGF-ADAPTER-001 - Docs -> Human Projection Mapping

Назначение: Формализовать правила преобразования spec-содержимого в человеко-читаемые документы.

Ключевые правила:
- Генератор MUST строить aagf/docs/human/** из YAML-спеков и manifest-конфигурации.
- Генератор MUST строить aagf/docs/human/adapters/<target>/** как человеко-читаемую проекцию target-runtime adapter-слоя.
- Каждый generated документ MUST содержать ссылку на source.
- Human-проекция MUST NOT добавлять нормативные правила, отсутствующие в source.

Условия (IF -> THEN):
- IF В human-слое обнаружен новый нормативный пункт без source THEN Пункт MUST быть удален или перенесен в source.
- IF Source-файл переименован THEN Generator mapping MUST быть обновлен в manifest до следующей генерации.

Проверки:
- Проверить валидность manifest и section specs.
- Проверить корректность ссылок source -> derived.
- Проверить наличие human-проекций для каждого target из manifest.
#### AAGF-ADAPTER-002 - Docs -> Multi-Target IDE Projection Mapping

Назначение: Формализовать правила построения переносимых adapter-пакетов для JetBrains и Cursor.

Ключевые правила:
- aagf/docs/adapters/jetbrains/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.aiassistant`.
- aagf/docs/adapters/cursor/** MUST агрегировать нормативные правила и prompts из aagf/docs/spec/** для runtime `.cursor`.
- Multi-target adapter-проекции MUST использовать только переносимые настройки без machine-specific данных.
- Синхронизация в активные runtime-контуры MUST выполняться только через target-aware sync (`docs:sync`) после явного подтверждения пользователя.

Условия (IF -> THEN):
- IF Workflow spec содержит prompts THEN Prompt-блок MUST быть включен в prompts-проекции каждого поддерживаемого target.
- IF Adapter-проекция конфликтует с source THEN Source MUST иметь приоритет, а adapter MUST быть перегенерирован.
- IF Запрошена синхронизация в `/.aiassistant/**` или `/.cursor/**` THEN Агент MUST сначала выполнить `docs:sync:check`, показать изменения и только после подтверждения выполнять `docs:sync`.

Проверки:
- Проверить, что rules/prompts отражают актуальный source для jetbrains и cursor.
- Проверить отсутствие абсолютных путей и локальных зависимостей.
- Проверить, что runtime-изменения выполнены через sync-процесс, а не ручными правками.
