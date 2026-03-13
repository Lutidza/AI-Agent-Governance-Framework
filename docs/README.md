# Главная карта документации

Этот файл является главным нормативным документом для всех подключаемых агентов.
Документы в `docs` формируют единый обязательный workflow ведения и поддержки проектов.

## Нормативные термины

- `ОБЯЗАН` = правило обязательно к исполнению.
- `ЗАПРЕЩЕНО` = действие недопустимо.
- `ДОПУСКАЕТСЯ` = действие разрешено только при выполнении условия.

## Область действия docs-контура

- Документы в `docs/` задают правила для ведения и поддержки целевых программных проектов.
- Эти документы являются прикладным контуром (правила работы с кодом, этапами и ролями в проектах).
- `AGENTS.md` регулирует только процесс разработки текущей документации в этом репозитории и не является частью прикладного контура `docs/`.

## Базовые правила написания и ведения

- Агент ОБЯЗАН использовать машинные, однозначные и проверяемые формулировки.
- Агент ОБЯЗАН использовать только нормативные маркеры: `ОБЯЗАН`, `ЗАПРЕЩЕНО`, `ДОПУСКАЕТСЯ`.
- Агент ОБЯЗАН использовать формат `IF -> THEN` для условных веток.
- Агент ОБЯЗАН писать имена файлов и папок на английском языке.
- Агент ОБЯЗАН вести содержимое документации на русском языке, если пользователь не указал иное.
- Агент ОБЯЗАН проверять связанные документы и ссылки перед и после правок.
- Агент ЗАПРЕЩЕНО создавать новые файлы/разделы без явного запроса пользователя.
- Агент ЗАПРЕЩЕНО удалять обязательные разделы и правила без явного запроса пользователя.

## Обязательный порядок применения документов

1. Применить основной регламент режимов: [mode-policy/mode-policy.md](G:\PacificNET\AI-Workspace\docs\mode-policy\mode-policy.md).
2. Применить правила конкретного режима: [read-only.md](G:\PacificNET\AI-Workspace\docs\mode-policy\read-only.md), [agent.md](G:\PacificNET\AI-Workspace\docs\mode-policy\agent.md), [agent-full-access.md](G:\PacificNET\AI-Workspace\docs\mode-policy\agent-full-access.md).
3. Применить ограничения безопасности: [security-and-constraints.md](G:\PacificNET\AI-Workspace\docs\security-and-constraints.md).
4. Применить операционный baseline среды: [webstorm-baseline-setup.md](G:\PacificNET\AI-Workspace\docs\webstorm-baseline-setup.md).
5. Применить правила масштабирования на другие модели/провайдеры: [multi-model-readiness.md](G:\PacificNET\AI-Workspace\docs\multi-model-readiness.md).
6. Использовать обзорный контекст проекта: [dialogue-analysis.md](G:\PacificNET\AI-Workspace\docs\dialogue-analysis.md).

## Условные правила (IF -> THEN)

1. IF задача не определена или контекста недостаточно THEN агент ОБЯЗАН работать в `Read-only`, запросить уточнения и не переходить к редактированию.
2. IF задача относится к рискованным изменениям THEN агент ОБЯЗАН выполнить цепочку: анализ -> план -> явное подтверждение пользователя -> выполнение.
3. IF требуется действие вне workspace, изменение системной среды, CI/CD или зависимостей THEN действие ЗАПРЕЩЕНО до явного подтверждения пользователя.
4. IF работает несколько агентов THEN один агент назначается дирижером (оркестратором), остальные работают только в рамках своей роли и передают результат через фиксированный handoff.
5. IF правило из профильного документа конфликтует с документом безопасности THEN приоритет у `security-and-constraints.md`.
6. IF изменены названия файлов/папок или структура разделов THEN агент ОБЯЗАН синхронизировать все перекрестные ссылки в документации.
7. IF формулировка правила допускает двойное толкование THEN агент ОБЯЗАН предложить унификацию и дождаться подтверждения пользователя.

## Карта документов по назначению

- Политики режимов: [mode-policy.md](G:\PacificNET\AI-Workspace\docs\mode-policy.md), [mode-policy/mode-policy.md](G:\PacificNET\AI-Workspace\docs\mode-policy\mode-policy.md)
- Правила исполнения по режимам: [read-only.md](G:\PacificNET\AI-Workspace\docs\mode-policy\read-only.md), [agent.md](G:\PacificNET\AI-Workspace\docs\mode-policy\agent.md), [agent-full-access.md](G:\PacificNET\AI-Workspace\docs\mode-policy\agent-full-access.md)
- Безопасность и ограничения: [security-and-constraints.md](G:\PacificNET\AI-Workspace\docs\security-and-constraints.md)
- Базовая операционная конфигурация: [webstorm-baseline-setup.md](G:\PacificNET\AI-Workspace\docs\webstorm-baseline-setup.md)
- Масштабирование на multi-model: [multi-model-readiness.md](G:\PacificNET\AI-Workspace\docs\multi-model-readiness.md)
- Контекст и исходные вводные: [dialogue-analysis.md](G:\PacificNET\AI-Workspace\docs\dialogue-analysis.md), [codex-operating-policy.md](G:\PacificNET\AI-Workspace\docs\codex-operating-policy.md)

## Правило отклонений

Любое отклонение от правил этого файла и связанных документов ДОПУСКАЕТСЯ только при явном разрешении пользователя.
