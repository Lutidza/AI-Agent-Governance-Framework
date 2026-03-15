<!-- GENERATED FILE: DO NOT EDIT MANUALLY -->
<!-- Source: docs/spec/core/README.md + docs/adapters/jetbrains/runtime/.aiassistant/rules/core/AAGF-CORE-003-stack-profiled-commenting-contract.md -->

# AAGF-CORE-003 (human projection)

Этот документ является человеко-читаемой проекцией runtime rule-entry для target `jetbrains`.

## Source mapping

- Product source section: `docs/spec/core/README.md`
- Adapter runtime source: `docs/adapters/jetbrains/runtime/.aiassistant/rules/core/AAGF-CORE-003-stack-profiled-commenting-contract.md`
- Runtime compatibility: `.aiassistant/rules/core/AAGF-CORE-003-stack-profiled-commenting-contract.md`
- Human projection path: `runtime/aiassistant/rules/core/AAGF-CORE-003-stack-profiled-commenting-contract.md`

## Контекст

- Section: `core` / Core
- Rule ID: `AAGF-CORE-003`
- Rule title: Stack-Profiled Commenting Contract
- Intent: Универсальные требования к комментариям задаются в core, а формат и теги берутся из stack-карты профилей.

## Нормативные правила
- Комментарии и метаданные версий MUST оформляться по активному stack doc profile из aagf/docs/spec/stacks/comment-doc-profiles.yaml.
- Для измененных публичных контрактов и нетривиальной логики MUST быть комментарий, который объясняет назначение, входы, выходы, ошибки и ограничения.
- Для измененных файлов MUST фиксироваться метаданные трассируемости (file, version, edited_at) в формате, определенном stack doc profile.
- Комментарии MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.
- Устаревшие, противоречащие коду комментарии и неконтролируемые TODO/FIXME MUST NOT оставаться в измененных участках.

## Условия IF -> THEN
- IF Активный stack doc profile не определен в контексте проекта THEN Агент MUST остановить переход в done и запросить явное подтверждение/выбор профиля.
- IF Изменена логика файла или публичный контракт THEN Агент MUST обновить комментарии и метаданные версии в том же изменении.
- IF Stack doc profile требует обязательные semantic-теги THEN Агент MUST использовать эквиваленты params/returns/throws/remarks в нативном синтаксисе языка.

## Проверки
- Проверить, что активный stack doc profile существует и доступен по ссылке.
- Проверить, что измененные файлы содержат требуемые profile-метаданные file/version/edited_at.
- Проверить отсутствие устаревших комментариев, placeholder-комментариев и неконтролируемых TODO/FIXME.
