# AI Agent Governance Framework

**Предлагаемая архитектура, подход и приёмы для превращения базовой инструкции в профессиональную систему управления ИИ-помощниками и агентами**

## Назначение

Стартовый архитектурный документ для формирования AI governance-framework, его продуктового дистрибутива и агентных интеграций под JetBrains IDE, Cursor IDE, Codex и другие среды.

## Контекст

Документ подготовлен на основе вашей базовой инструкции, целевой идеи AAGF и требований к современным стандартам агентной разработки.

## Фокус v1

Создать ядро правил, адаптеры JetBrains и Cursor, модель интеграции в любой проект и управляемую эволюцию к мультиагентному режиму.

## Зафиксированное решение vNext (подтверждено)

1. AAGF MUST сразу развиваться как multi-target framework для JetBrains и Cursor без поэтапного alias-перехода.
2. Редактируемым source-слоем MUST быть только `aagf/docs/spec/**`; `aagf/docs/human/**` и `aagf/docs/adapters/**` MUST быть только generated-представлениями.
3. Этап обсуждения архитектуры MUST считаться завершенным; текущий этап MUST трактоваться как подготовка к внедрению target-aware генерации.
4. До старта реализации target-aware генерации MUST быть синхронизированы `initial-data/AAGF_Architecture_Proposal_ru_v2.md`, корневой `README.md` и `aagf/docs/README.md`.
5. Alias-модель adapter-слоя MUST NOT использоваться, чтобы исключить drift между архитектурой и структурой.

## Зафиксированное решение по интеграции AAGF в целевой проект

Интеграция AAGF в новый или существующий проект MUST выполняться как управляемый bootstrap-процесс:

1. **Install**: подключить продуктовый дистрибутив `aagf/` в корень проекта и подготовить стратегию применения root `AGENTS.md` (merge/confirm, без неявного overwrite).
2. **Detect**: агент MUST определить стек и контекст проекта по файловым маркерам, конфигам и структуре репозитория.
3. **Confirm**: специалист MUST подтвердить или скорректировать результат детекции (auto-решение без порога confidence MUST NOT применяться).
4. **Compose**: выбрать подключаемые наборы правил, ролей, prompts и project-overrides.
5. **Generate**: сформировать `aagf/docs/human/**` и `aagf/docs/adapters/**` из `aagf/docs/spec/**`.
6. **Sync**: синхронизировать выбранный target в runtime-контур (`/.aiassistant/**`, `/.cursor/**`) только после явного подтверждения.
7. **Lock**: зафиксировать выбранный профиль проекта и активированные packs как baseline для последующих изменений.

Распределение ответственности MUST быть следующим:

- **Правила** задают инварианты, пороги confidence и обязательные контрольные точки.
- **Промпты** задают операционный сценарий диалога и принятия решений.
- **Агент** выполняет детекцию, компоновку и верификацию.
- **MCP** MAY использоваться как усилитель контекста, но интеграция MUST работать и без MCP.

## Ключевой вывод

Ваша базовая инструкция уже содержит сильный инженерный каркас, но сейчас она работает как единый манифест. Для профессиональной системы её нужно превратить в многоуровневый framework: ядро политик, адаптеры под среды, стековые пакеты, workflow-пакеты, роли агентов, проектные overrides и механизмы валидации интеграции. При этом проект следует строить сразу в модели **declarative-first**: первичный источник истины — машиночитаемые manifest/spec-файлы, а Markdown-документы, `AGENTS.md`, JetBrains/Cursor runtime rules и другие adapter outputs являются производными и синхронизируемыми представлениями.

---

## 1. Цель и проектная позиция AAGF

AAGF следует трактовать как AI governance-framework для ИИ-агентов в разработке. Его задача — не хранить произвольные промпты, а задавать формальные правила поведения, пределы автономности, workflow, роли и способы интеграции в конкретный проект.

Фреймворк должен решать три класса проблем:

1. хаотичное поведение агентов;
2. смешение универсальных и стековых инструкций;
3. отсутствие продуктового слоя политики между проектами и IDE.

Практический результат AAGF — продуктовый дистрибутив `aagf/` с единым source-слоем правил и адаптерных проекций, который можно внедрить в новый репозиторий, быстро активировать в IDE и использовать как базу для одиночных и мультиагентных сценариев.

Операционная модель MUST разделять три плоскости:

1. `Control Plane` — контур развития AAGF (root/meta), где эволюционируют архитектура и правила framework.
2. `Delivery Plane` — продуктовый дистрибутив `aagf/`, который поставляется в целевые проекты.
3. `Project Instance` — локальный инстанс AAGF в целевом проекте, который определяет контекст, подбирает packs, генерирует проекции и управляет оптимизацией инженерного контура вокруг себя.

---

## 2. Диагноз текущей базовой инструкции

Текущая инструкция качественна по содержанию: в ней уже есть требования к роли ИИ, процессу работы, инженерным стандартам, формату ответов, комментированию и ограничениям по изменениям.

Главная проблема не в содержании, а в структуре. В одном документе смешаны постоянные инварианты проекта, режимы работы, требования к output, правила документирования, naming conventions и локальные инструкции для конкретного чата.

В таком виде инструкция плохо масштабируется: её трудно переносить между IDE, стеками и агентами; её сложно поддерживать версионировано и валидировать автоматически.

---

## 3. Целевая архитектура AAGF

AAGF целесообразно строить как шесть связанных слоёв:

| Слой | Назначение | Что входит | Что не должно храниться |
|---|---|---|---|
| **Core** | Независимые от среды политики | Глоссарий, нормативные маркеры, lifecycle задач, критерии done, safety-policy, приоритет правил | IDE-специфичные настройки и стековые детали |
| **Surface adapters** | Маппинг core в конкретную среду | JetBrains rules, Cursor rules, Prompt Library, `AGENTS.md`, MCP-конфиги, generated adapter artifacts | Бизнес-логика конкретного проекта |
| **Stack packs** | Стековые ограничения и best practices | Payload CMS 3, Next.js, TS, PostgreSQL, naming, test strategy, docs policy | Глобальные роли и общие процессы |
| **Workflow packs** | Повторяемые сценарии работы | `plan-first`, `safe-refactor`, `bugfix-from-logs`, `docs-sync`, `review`, `migration` | Постоянные universal rules |
| **Role packs** | Специализация агентов | `architect`, `implementer`, `reviewer`, `debugger`, `docs-maintainer`, `release-keeper` | Конкретные файлы целевого проекта |
| **Project overrides** | Локальная адаптация под репозиторий | Доменные ограничения, исключения, repo policy, file exclusions, commands | Изменение core без явной причины |

Принцип проектирования: AAGF должен с **v1** опираться на машиночитаемый `source of truth`. Core policy, роли, workflow, stack packs и adapter bindings описываются в manifest/spec-слое (например, `kit.manifest.yaml`, `core/policies/*.yaml`, `core/workflows/*.yaml`, `adapters/*.yaml`), а адаптеры генерируют или синхронизируют surface-specific артефакты: `AGENTS.md`, skill metadata, `aagf/docs/human/**`, `aagf/docs/adapters/jetbrains/**`, `aagf/docs/adapters/cursor/**`, runtime-пакеты `/.aiassistant/**`, `/.cursor/**` и другие integration outputs.

---

## 4. Модель слоёв и артефактов

Ключевые типы артефактов и их роль:

| Артефакт | Статус | Источник правды | Комментарий |
|---|---|---|---|
| `README.md` | Мета-документ репозитория | Repository charter | Назначение контура разработки AAGF, контуры, конвенции, process управления |
| `AGENTS.md` | Операционный контракт мета-контура | Root operational contract | Durable instructions для агентов, которые развивают сам AAGF |
| `initial-data/**` | Референсный слой | Reference inputs | Входные материалы анализа и проектирования, не часть продуктового дистрибутива |
| `aagf/docs/README.md` | Нормативный вход продуктового пакета | Product normative entry | Главная карта правил применения AAGF в целевых проектах |
| `aagf/docs/AGENTS.md` | Операционный вход продуктового пакета | Product operational entry | Контракт для агентов, работающих в целевом проекте через docs-пакет |
| `aagf/docs/spec/**` | Product machine-readable source | Product source layer | Первичный source layer продуктового пакета |
| `aagf/docs/human/**` | Product human-readable layer | Product derived layer | Человеко-читаемая проекция `aagf/docs/spec/**` |
| `aagf/docs/adapters/jetbrains/**` | Продуктовый adapter-пакет | Product adapter package | Adapter-проекция `aagf/docs/spec/**` для синхронизации в `/.aiassistant/**` |
| `aagf/docs/adapters/cursor/**` | Продуктовый adapter-пакет | Product adapter package | Adapter-проекция `aagf/docs/spec/**` для синхронизации в `/.cursor/**` |
| `/.aiassistant/**` | Активный runtime adapter | Environment runtime adapter | Фактически активные JetBrains-артефакты текущего/целевого репозитория |
| `/.cursor/**` | Активный runtime adapter | Environment runtime adapter | Фактически активные Cursor-артефакты текущего/целевого репозитория |
| Prompt Library entries | IDE-level reusable actions | Surface adapter | Шаблоны действий и расширения встроенных prompts |
| MCP configs | Инструментальный доступ | Surface adapter / environment config | Подключение внешних систем, но не хранение базовых правил проекта |
| `kit.manifest.yaml` | Корневой манифест framework-а | Primary machine-readable source | Обязательный корневой источник истины уже с `v1` |
| `core/**/*.yaml` | Формальные policy/workflow/role specs | Machine-readable source | Основной нормативный слой для генерации и валидации |
| `dist/**` или generated adapter outputs | Производные артефакты | Build/generation pipeline | Сюда попадают `AGENTS.md`, `aagf/docs/**`, `/.aiassistant/**`, `/.cursor/**`, skill files и другие runtime-представления |

### Принцип `declarative-first`

Для AAGF следует зафиксировать жёсткое правило: **Markdown не является единственным источником истины**. Читаемые человеком документы остаются обязательными, но они должны быть либо синхронизированы с машинным слоем, либо генерироваться из него. Это снижает дрейф между средами, делает правила проверяемыми, позволяет валидировать конфликты, держать единый versioned governance-layer и строить адаптеры под Codex, JetBrains, Cursor, MCP и будущие поверхности без ручного переписывания.

Минимальный состав machine-readable слоя для `v1`:

- `kit.manifest.yaml` — идентичность framework-а, версия, precedence, defaults;
- `core/policies/*.yaml` — универсальные policy rules;
- `core/workflows/*.yaml` — repeatable workflows и done criteria;
- `core/roles/*.yaml` — роли агентов и границы ответственности;
- `stacks/**/*.yaml` — стековые пакеты;
- `adapters/**/*.yaml` — правила маппинга в Codex / JetBrains / Cursor / MCP.

Практический вывод: `README.md`, `AGENTS.md`, `aagf/docs/README.md`, `aagf/docs/AGENTS.md`, `aagf/docs/human/**`, `aagf/docs/adapters/**`, `/.aiassistant/**`, `/.cursor/**`, Prompt Library entries и другие surface-specific артефакты должны считаться производными или операционными представлениями. Первичный source layer продуктового пакета должен находиться в `aagf/docs/spec/**`.

### Режим внесения изменений (`AI-only`)

Для `v1` и последующих версий следует зафиксировать отдельное операционное правило:

- изменения governance-слоя выполняются через ИИ-агентов в agent-режиме;
- вручную редактируется только machine-readable слой `aagf/docs/spec/**`;
- ручное редактирование `.md` документов не используется как рабочий процесс;
- правки должны вноситься в machine-readable слой (`manifest/spec`), после чего человеко-читаемые документы синхронизируются генерацией;
- исключения MAY применяться только по явному решению владельца проекта с обязательной последующей синхронизацией со spec-слоем.

Практическое следствие: `aagf/docs/spec/**` является первичным местом нормотворчества продуктового пакета; `aagf/docs/human/**`, `aagf/docs/adapters/**`, `AGENTS.md`, `/.aiassistant/**`, `/.cursor/**` и другие текстовые/adapter-представления являются производными слоями.

---

## 5. Маппинг в JetBrains и Cursor

JetBrains и Cursor должны восприниматься как adapter layers, а не как источники универсальных правил.

### Предлагаемое распределение

- `AGENTS.md` (корень): операционный контракт мета-контура разработки AAGF.
- `aagf/docs/AGENTS.md`: операционный контракт продуктового docs-контура для целевых проектов.
- `aagf/docs/spec/**`: machine-readable source layer docs-контура.
- `aagf/docs/human/**`: human-readable derived layer docs-контура.
- `aagf/docs/adapters/jetbrains/**`: продуктовый adapter-пакет docs-контура для JetBrains.
- `aagf/docs/adapters/cursor/**`: продуктовый adapter-пакет docs-контура для Cursor.
- `/.aiassistant/**`: активный runtime-слой JetBrains в текущем/целевом репозитории.
- `/.cursor/**`: активный runtime-слой Cursor в текущем/целевом репозитории.
- Sync policy:
  1. нормативные изменения вносятся в `aagf/docs/spec/**`;
  2. из `aagf/docs/spec/**` синхронизируются `aagf/docs/human/**`, `aagf/docs/adapters/jetbrains/**`, `aagf/docs/adapters/cursor/**`;
  3. синхронизация в runtime-слои (`/.aiassistant/**`, `/.cursor/**`) выполняется только по явному подтверждению;
  4. после синхронизации проверяется drift между `aagf/docs/spec/**`, `aagf/docs/human/**`, `aagf/docs/adapters/**`, runtime-слоями.
- Prompt Library: может храниться как продуктовый шаблонный набор в `aagf/docs/adapters/<target>/**` и как активный runtime-набор в соответствующем runtime-слое.
- MCP: только инструментальный слой — issue trackers, docs portals, internal services. MCP не должен подменять policy layer.
- Agents registry / ACP: использовать для подключения внешних coding agents, но правила их поведения должны ссылаться на core AAGF, а не жить только в runtime-конфигурации IDE.

Ключевой принцип: `aagf/docs/spec/**` — source, `aagf/docs/human/**` и `aagf/docs/adapters/**` — производные продуктовые слои, `/.aiassistant/**` и `/.cursor/**` — активные runtime-применения в конкретном проекте.

---

## 6. Правила качества документов и нормотворчества

Чтобы базовая инструкция превратилась в профессиональную систему, документы нужно писать не как prose-заметки, а как нормативные спецификации.

### Обязательные принципы

- использовать короткие и проверяемые правила с идентификаторами, например `AAGF-CORE-001`;
- разделять нормативные и пояснительные документы: `standard` vs `rationale/example`;
- использовать маркеры `MUST`, `MUST NOT`, `MAY` и условные конструкции `IF -> THEN`;
- фиксировать `rule precedence`: `core -> adapter -> stack pack -> project override` либо иной формальный порядок;
- вести changelog и compatibility notes для каждого значимого релиза фреймворка;
- использовать относительные ссылки внутри репозитория; абсолютные локальные пути недопустимы для продуктового дистрибутива.

### Типы документов

| Тип документа | Назначение | Пример |
|---|---|---|
| **Normative** | То, что агент MUST соблюдать | `core policy`, `stack rule`, `edit safety` |
| **Operational** | Как именно агент работает по этапам | `plan-first`, `approvals`, `handoff`, `done criteria` |
| **Reference** | Почему правило существует и как им пользоваться | `examples`, `anti-patterns`, `migration notes` |

---

## 7. Операционная политика использования агентов

Операционная политика должна жить отдельно от статических rules. Это критично для управляемости агентов.

| Класс задачи | Режим | Reasoning | Обязательный процесс |
|---|---|---|---|
| Анализ / объяснение / обзор | `Read-only` | `Medium` | Анализ -> вывод -> риски |
| Локальный безопасный рефакторинг | `Agent` | `Medium` | Анализ -> план -> изменение -> self-check |
| Сложная архитектурная задача | `Read-only` или `Agent` после согласования | `High` | Анализ -> альтернативы -> план -> реализация по шагам |
| `CI/CD`, dependency updates, migrations | `Read-only` по умолчанию | `High` | Сначала предложение и оценка рисков; действия только после явного подтверждения |
| Системные действия вне workspace | `Full access` только как исключение | `High` | Отдельный approval path, журналирование и rollback plan |

Минимальный operational contract для `v1`:

- `default mode = Read-only`;
- `default reasoning = medium`;
- `plan-first` для всех нетривиальных задач;
- переход к следующему шагу только после тестирования и обратной связи от пользователя.

---

## 8. Предлагаемая структура репозитория

Рекомендуемая структура AAGF-репозитория для первой зрелой версии:

```text
AAGF/
  README.md
  AGENTS.md
  initial-data/
    AAGF_Architecture_Proposal_ru_v2.md
    AI_INSTRUCTION.md
  aagf/
    package.json
    tools/
      src/
      templates/
      README.md
    docs/
      README.md
      AGENTS.md
      spec/
        README.md
        manifests/
          docs.manifest.yaml
        core/
        stacks/
        workflows/
        roles/
        adapters/
        schemas/
        project/
          context.yaml
          stack-detection.yaml
          enabled-packs.yaml
          overrides.yaml
          profile.lock.yaml
      human/
        README.md
        core/
        stacks/
        workflows/
        roles/
        adapters/
      adapters/
        jetbrains/
          README.md
          runtime/
            .aiassistant/
              rules/
              prompts/
        cursor/
          README.md
          runtime/
            .cursor/
              rules/
              prompts/
```

Этот скелет формирует `separation of concerns`: `initial-data` как reference-контур, `root/meta` как control plane развития framework, `aagf/` как delivery plane (продуктовый дистрибутив), `aagf/docs/spec` как source layer дистрибутива, `aagf/docs/human` и `aagf/docs/adapters` как производные слои, `/.aiassistant` и `/.cursor` как активные runtime adapter layers проектного инстанса.

---

## 9. Подход к внедрению в целевой проект

1. Подключить в целевой проект продуктовый дистрибутив `aagf/` (минимум: `aagf/package.json`, `aagf/tools/**`, `aagf/docs/**`).
2. Применить правила docs-контура из `aagf/docs/**` как основной operational слой для агентной работы в проекте.
3. Проверить, что `aagf/docs/spec/**` рассматривается как source of truth в целевом проекте.
4. Синхронизировать `aagf/docs/adapters/jetbrains/**` в `/.aiassistant/**` и `aagf/docs/adapters/cursor/**` в `/.cursor/**` только по явному подтверждению.
5. Подключить Prompt Library и минимальные workflow prompts через активные runtime-слои выбранной IDE.
6. Настроить operational policy команды: режимы, approvals, reasoning, handoff.
7. Добавить/обновить профильные документы в `aagf/docs/spec/**`, затем синхронизировать `aagf/docs/human/**`.
8. Пройти integration checklist: видимость правил, отсутствие конфликтов, корректная синхронизация всех слоев (`spec`/`human`/adapter), работоспособность prompts.

Важно: внедрение должно быть additive. Локальный проект может дополнять пакет, но не должен бесконтрольно изменять core-политику. Для этого заранее фиксируется механизм overrides, precedence и drift-контроля.

---

## 10. Рекомендуемый roadmap `v1 -> v2`

| Этап | Цель | Состав | Критерий выхода |
|---|---|---|---|
| `v1 / Foundation` | Сразу заложить declarative-first основу + продуктовый дистрибутив `aagf/` + dual-target adapters (JetBrains, Cursor) | `README`, `AGENTS`, `initial-data/**`, `aagf/package.json`, `aagf/tools/**`, `aagf/docs/README.md`, `aagf/docs/AGENTS.md`, `aagf/docs/spec/**`, `aagf/docs/human/**`, `aagf/docs/adapters/**` | Дистрибутив `aagf/` можно внедрить в проект и получить предсказуемое базовое поведение на едином machine-readable source |
| `v1.1 / Governance hardening` | Усилить формализацию и валидацию | Rule IDs, precedence, changelog, compatibility matrix, integration checklist, schema validation | Governance-слой становится проверяемым и поддерживаемым |
| `v2 / Generation pipeline` | Автоматизировать выпуск производных слоев и adapter outputs | генерация `aagf/docs/human/**`, `aagf/docs/adapters/**`, runtime слоев `/.aiassistant/**` и `/.cursor/**`, `AGENTS.md`, skills из `aagf/docs/spec/**` и manifest/spec-слоя | Снижается ручная синхронизация и дрейф между source и runtime-слоями |
| `v2.1 / MCP alignment` | Добавить MCP-совместимые представления | prompts/resources/tools/roots descriptors, adapter bindings, runtime contracts | AAGF начинает работать как vendor-neutral governance layer для agent ecosystems |
| `v3 / Multi-agent` | Поддержать роли и orchestration | Role packs, handoff protocol, bounded sub-agents, review gates | AAGF управляет не только одним агентом, но и pipeline из нескольких |

---

## 11. Практические приёмы

- писать правила короткими блоками, а не большими манифестами;
- не смешивать policy и prompts: policy определяет нормы, prompt определяет способ вызова сценария;
- не держать единственный источник знаний в IDE-конфиге; базовая истина должна жить в machine-readable core-слое (`kit.manifest.yaml`, `core/**/*.yaml`) и в product source-слое `aagf/docs/spec/**`;
- разделять machine-readable и human-readable представления правил;
- держать `aagf/` автономным продуктовым дистрибутивом; не использовать абсолютные пути и внешние контурные зависимости;
- разделять слои docs-пакета: `aagf/docs/spec/**` как source, `aagf/docs/human/**` как human-readable derived, `aagf/docs/adapters/**` как продуктовые adapter derived, `/.aiassistant/**` и `/.cursor/**` как активные runtime layers;
- фиксировать анти-паттерны: `rewrite` вместо `refactor`, скрытые breaking changes, примеры вместо production-code, rule drift между docs и IDE;
- для каждого workflow иметь минимальный checklist: входные данные, допустимые действия, критерии завершения, формат отчёта;
- для мультиагентности использовать bounded roles: главный агент держит требования и решения, подагенты — исследование, логи, тесты и triage.

Ваше исходное правило «сначала анализ, затем план, затем реализация по шагам» должно стать не пожеланием, а основой workflow-pack и operational policy. Это один из самых ценных элементов исходной инструкции.

---

## 12. Итоговые рекомендации

1. Первая зрелая поставка должна сразу включать dual-target адаптеры под JetBrains и Cursor на едином core-слое, без дублирования policy-логики.
2. Зафиксировать правило `source of truth`: universal policy живёт в core, surface-specific artifacts только отражают её. Это защитит систему от дрейфа и дублирования.
3. Разделить ваш исходный master-manifest на набор специализированных документов и generated outputs. Только так инструкция станет профессиональной системой, пригодной для масштабирования и командной эксплуатации.
4. Заложить с самого начала версионирование, compatibility matrix и integration checklist. Без этого AAGF останется хорошей коллекцией правил, но не станет framework-ом управления агентами.

---

## Приложение A. Минимальный перечень документов, которые стоит подготовить следующими

- **AAGF Mission and Scope** — краткое официальное определение framework-а.
- **Governance Model** — уровни политики, объекты управления, `source of truth`.
- **Rule Precedence** — формальный порядок разрешения конфликтов.
- **Docs Package Contract** — как работают `aagf/docs/README.md`, `aagf/docs/AGENTS.md` и автономность продуктового дистрибутива.
- **Docs Machine-Readable Specification** — структура и контракты `aagf/docs/spec/**`.
- **Docs Human Projection Specification** — правила синхронизации `aagf/docs/human/**` из `aagf/docs/spec/**`.
- **Docs Adapter Package Specification** — как устроен `aagf/docs/adapters/**` и как выполняется синхронизация в runtime-слои IDE.
- **JetBrains Runtime Adapter Specification** — как активный `/.aiassistant/**` маппится из source-слоя.
- **Cursor Runtime Adapter Specification** — как активный `/.cursor/**` маппится из source-слоя.
- **Payload CMS / Next.js Stack Pack** — первый зрелый стековый пакет.
- **Operational Policy** — режимы работы агентов, approvals, handoff и done criteria.
- **Integration Checklist** — проверка качества внедрения AAGF в новый проект.

---

## Приложение B. Актуальная нормативная опора

Ниже перечислены направления, на которые опирается предлагаемая архитектура. Ссылки включены как ориентир для дальнейшей проработки и верификации интеграций:

- OpenAI Codex: `Custom instructions with AGENTS.md`
- OpenAI Codex: `Customization (AGENTS.md, skills, MCP, multi-agents)`
- OpenAI Codex: `Skills`
- OpenAI Codex: `Best practices`
- OpenAI Codex: `Multi-agents`
- JetBrains AI Assistant: `Configure project rules`
- JetBrains AI Assistant: `Add and customize prompts`
- JetBrains AI Assistant: `AI Chat`
- JetBrains AI Assistant: `Features and compatibility`
