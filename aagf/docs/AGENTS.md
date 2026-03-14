# Контракт агентов docs-контура

Этот файл задает операционные правила для работы с переносимым docs-пакетом AAGF.

## Область действия

- `README.md` и `AGENTS.md` в этой папке MUST рассматриваться как нормативный и операционный вход docs-контура.
- `spec/**` MUST рассматриваться как machine-readable source layer.
- `human/**` MUST рассматриваться как derived human layer.
- `adapters/**` MUST рассматриваться как derived adapter layer.

## Правила изменения слоев

- Агент MUST вносить первичные изменения только в `spec/**`.
- Агент MUST синхронизировать `human/**` и `adapters/**` после изменения `spec/**`.
- IF пользователь запрашивает прямую правку в `human/**` или `adapters/**` THEN агент MAY выполнить ее только как исключение и затем MUST синхронизировать `spec/**`.

## Модель модульных правил

- Агент MUST поддерживать правила в `spec/**` как модульные rule-файлы, а не как единый монолитный текст.
- Каждый rule-файл MUST иметь стабильный `rule_id`, область действия и проверяемые условия активации.
- Агент MUST поддерживать generated-индекс/карту правил в `human/**` и `adapters/**` для навигации и контроля drift.
- IF требуется выборочное включение/выключение правил THEN агент MUST использовать `spec/project/enabled-packs.yaml` и `spec/project/overrides.yaml`.
- Для runtime-контура конкретной IDE агент MAY агрегировать правила в единый файл, если это ограничение target-формата.

## Multi-target adapters

- `adapters/jetbrains/**` MUST хранить generated-артефакты для JetBrains.
- `adapters/cursor/**` MUST хранить generated-артефакты для Cursor.
- IF требуется runtime-синхронизация THEN источником MUST быть `adapters/<target>/runtime/**`.
- Runtime-приемники MUST быть `.aiassistant/**` и `.cursor/**` в корне целевого проекта.

## Bootstrap-протокол

- Агент MUST выполнять шаги: `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.
- На шаге `Install` root `AGENTS.md` MUST применяться только в merge-режиме.
- На шаге `Detect` MUST использоваться `spec/project/stack-detection.yaml`.
- На шаге `Lock` MUST обновляться `spec/project/profile.lock.yaml`.

## Контроль drift

- Агент MUST проверить консистентность между `spec/**`, `human/**`, `adapters/**`.
- IF обнаружен drift THEN изменение MUST NOT считаться завершенным.
- Агент MUST использовать формулировки `MUST`, `MUST NOT`, `MAY` и формат `IF -> THEN`.
