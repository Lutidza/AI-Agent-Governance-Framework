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
- Для текущего стека MUST использоваться формат langDoc, определенный в активном stack doc profile.
- Человеко-читаемый текст комментариев MUST быть на русском языке (описания, remarks, пояснения, changes-блоки, тексты param/returns/throws); технические идентификаторы, имена API и синтаксис тегов MAY оставаться в оригинале.
- Для измененных публичных контрактов и нетривиальной логики MUST быть комментарий, который объясняет назначение, входы, выходы, ошибки и ограничения.
- Для измененных функций/методов MUST присутствовать doc-комментарий в профильном формате; для измененных внутренних операций комментарий MUST добавляться, если логика нетривиальна или влияет на поведение.
- Обязательные semantic-теги профиля (params/returns/throws/remarks) MUST заполняться при наличии соответствующей семантики, optional-теги (example/see/link/deprecated) MUST использоваться, когда их семантика присутствует.
- Для измененных файлов MUST фиксироваться метаданные трассируемости (file, version, edited_at) в формате, определенном stack doc profile.
- Метаданные file/version/edited_at MUST располагаться в header-блоке файла в порядке и синтаксисе, определенном active profile.
- После общего описания файла MUST указываться блок "последние изменения текущей версии" в формате active profile.
- Для измененных участков MAY использоваться profile-defined marker комментарии, если профиль требует явную маркировку изменений.
- Комментарии MUST NOT дублировать очевидный синтаксис и MUST NOT содержать placeholder-тексты.
- Устаревшие, противоречащие коду комментарии и неконтролируемые TODO/FIXME MUST NOT оставаться в измененных участках.
- Если в изменяемом файле обнаружены комментарии, не соответствующие активному profile, агент MUST нормализовать их в том же изменении.
- Пример оформления комментариев MUST браться из example_refs активного профиля; отсутствие example_refs считается drift профиля.

## Условия IF -> THEN
- IF Активный stack doc profile не определен в контексте проекта THEN Агент MUST остановить переход в done и запросить явное подтверждение/выбор профиля.
- IF Изменена логика файла или публичный контракт THEN Агент MUST обновить комментарии и метаданные версии в том же изменении.
- IF Stack doc profile требует обязательные semantic-теги THEN Агент MUST использовать эквиваленты params/returns/throws/remarks в нативном синтаксисе языка.
- IF Stack doc profile определяет обязательные change markers для edited blocks THEN Агент MUST проставить marker в каждом измененном блоке, подпадающем под правило профиля.
- IF В измененном участке остаются TODO/FIXME THEN Каждая запись MUST содержать причину и task reference согласно policy профиля.
- IF В измененном или новом комментарии обнаружен человеко-читаемый текст не на русском языке THEN Агент MUST нормализовать комментарий на русский язык в том же изменении.

## Проверки
- Проверить, что активный stack doc profile существует и доступен по ссылке.
- Проверить, что профиль содержит example_refs и ссылка(и) на canonical-примеры разрешаются.
- Проверить, что измененные файлы содержат требуемые profile-метаданные file/version/edited_at.
- Проверить, что порядок и синтаксис header-метаданных соответствуют active profile.
- Проверить, что комментарии покрывают измененные публичные контракты, измененные функции/методы и нетривиальные измененные участки.
- Проверить, что блок "последние изменения текущей версии" присутствует и актуален.
- Проверить корректное использование required/optional semantic-тегов по active profile.
- Проверить, что человеко-читаемые части комментариев и metadata-блоков оформлены на русском языке.
- Проверить отсутствие устаревших комментариев, placeholder-комментариев и неконтролируемых TODO/FIXME.
