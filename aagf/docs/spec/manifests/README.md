# manifests

Здесь хранятся корневые machine-readable манифесты docs-контура.

- Манифест MUST определять версию пакета, source of truth и rule precedence.
- Изменение структуры пакета MUST сопровождаться обновлением манифеста.
- Секция `sections` в манифесте MUST включать `spec_data` для каждой производной проекции.
- Секция `generators.targets` MUST описывать target-выходы как минимум для `jetbrains` и `cursor`.
- Для каждого target MAY использоваться вывод в `docs/human/adapters/<target>/**` как человеко-читаемая проекция runtime-адаптера.
