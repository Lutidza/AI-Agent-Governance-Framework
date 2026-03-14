<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/stacks/README.md -->

# stacks

Стековые профили и заменяемые технологические блоки.

## Источник

- Spec-source: [`docs/spec/stacks/README.md`](../../spec/stacks/README.md)
- Spec-data: [`docs/spec/stacks/profiles.yaml`](../../spec/stacks/profiles.yaml)

## Операционные записи
### AAGF-STACK-001 - Stack Pack как заменяемый модуль

Назначение: Стековый блок должен заменяться без изменения core-политик.

Правила:
- Stack-spec MUST описывать только технологические требования конкретного стека.
- Stack-spec MUST NOT изменять core-инварианты governance-системы.
- Замена stack pack MAY выполняться без изменений в core/**.

IF -> THEN:
- IF Требуется изменить правила тестирования для конкретного стека THEN Изменение MUST вноситься в stack-spec, а не в core-политики.
- IF Stack-spec вводит правило, конфликтующее с core THEN Конфликт MUST быть эскалирован и разрешен через rule precedence.

Проверки:
- Проверить, что изменения ограничены stack-слоем.
- Проверить, что core-политики остаются неизменными.
### AAGF-STACK-002 - Документирование стековых допущений

Назначение: Для каждого стека должны быть формализованы ограничения, риски и критерии валидации.

Правила:
- Stack-spec MUST включать ограничения по зависимостям и версионированию.
- Stack-spec MUST включать требования к тестированию и quality gates.
- Stack-spec MUST использовать единый формат rule IDs и IF -> THEN условий.

IF -> THEN:
- IF В stack-spec добавлена новая зависимость THEN MUST быть добавлены проверка совместимости и migration notes.
- IF Stack-изменение влияет на CI/CD THEN Изменение MUST быть отмечено как risk-critical и требовать подтверждения.

Проверки:
- Проверить наличие rule IDs, checks и risk notes.
- Проверить согласованность stack-spec с workflow и role спецификациями.

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
