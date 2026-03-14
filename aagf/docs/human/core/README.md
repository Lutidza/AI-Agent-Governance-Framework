<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/manifests/docs.manifest.yaml + docs/spec/core/README.md -->

# core

Базовые стек-независимые инварианты и правила.

## Источник

- Spec-source: [`docs/spec/core/README.md`](../../spec/core/README.md)
- Spec-data: [`docs/spec/core/rules.index.yaml`](../../spec/core/rules.index.yaml)

## Операционные записи
### AAGF-CORE-001 - Declarative-First Source of Truth

Назначение: Все нормативные изменения должны начинаться в machine-readable слое.

Правила:
- aagf/docs/spec/** MUST рассматриваться как primary source of truth.
- aagf/docs/human/** и aagf/docs/adapters/** MUST рассматриваться как derived layers.
- Прямые изменения в derived layers MUST NOT считаться завершенными без синхронизации source-слоя.

IF -> THEN:
- IF Изменение внесено только в aagf/docs/human/** или aagf/docs/adapters/** THEN Агент MUST внести эквивалентное изменение в aagf/docs/spec/** в том же шаге.
- IF Выявлен конфликт между source и derived слоями THEN Приоритет MUST быть у aagf/docs/spec/**.

Проверки:
- Проверить, что изменение зафиксировано в aagf/docs/spec/**.
- Проверить, что docs:generate не создает неожиданный drift.
### AAGF-CORE-002 - Контурная изоляция

Назначение: Слои root/meta, docs и runtime adapters должны оставаться разделенными.

Правила:
- Агент MUST явно определять целевой контур до начала правок.
- Правила root/meta и docs MUST NOT смешиваться в одном действии без явного запроса пользователя.
- Межконтурные изменения MAY выполняться только с явным подтверждением.

IF -> THEN:
- IF Задача затрагивает более одного контура THEN Агент MUST запросить подтверждение пользователя до внесения правок.
- IF Контур задачи не определен THEN Агент MUST остановиться и запросить уточнение.

Проверки:
- Проверить список измененных файлов и их принадлежность контуру.
- Проверить, что в handoff указан затронутый контур.
### AAGF-CORE-003 - Stack-Profiled Commenting Contract

Назначение: Универсальные требования к комментариям задаются в core, а формат и теги берутся из stack-карты профилей.

Правила:
- Комментарии и метаданные версий MUST оформляться по активному stack doc profile из aagf/docs/spec/stacks/comment-doc-profiles.yaml.
- Для измененных публичных контрактов и нетривиальной логики MUST быть комментарий, который объясняет назначение, входы, выходы, ошибки и ограничения.
- Для измененных файлов MUST фиксироваться метаданные трассируемости (file, version, edited_at) в формате, определенном stack doc profile.
- Комментарии MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.
- Устаревшие, противоречащие коду комментарии и неконтролируемые TODO/FIXME MUST NOT оставаться в измененных участках.

IF -> THEN:
- IF Активный stack doc profile не определен в контексте проекта THEN Агент MUST остановить переход в done и запросить явное подтверждение/выбор профиля.
- IF Изменена логика файла или публичный контракт THEN Агент MUST обновить комментарии и метаданные версии в том же изменении.
- IF Stack doc profile требует обязательные semantic-теги THEN Агент MUST использовать эквиваленты params/returns/throws/remarks в нативном синтаксисе языка.

Проверки:
- Проверить, что активный stack doc profile существует и доступен по ссылке.
- Проверить, что измененные файлы содержат требуемые profile-метаданные file/version/edited_at.
- Проверить отсутствие устаревших комментариев, placeholder-комментариев и неконтролируемых TODO/FIXME.

## Инвариант синхронизации

- Этот документ MUST рассматриваться как derived-представление source-слоя.
- IF документ расходится с source-слоем THEN приоритет MUST быть у `docs/spec/**`.
