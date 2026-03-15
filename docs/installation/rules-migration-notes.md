# Migration Notes: Rules Naming v2

Этот документ фиксирует миграцию runtime rule-файлов на новый контракт нейминга.

## Что изменилось

- Старый формат:
  - `.aiassistant/rules/<section>/<rule-id>.md`
  - `.cursor/rules/<section>/<rule-id>.md`
- Новый формат:
  - `.aiassistant/rules/<section>/<rule-id>-<file-slug>.md`
  - `.cursor/rules/<section>/<rule-id>-<file-slug>.mdc`

## Пример

- Было: `.aiassistant/rules/workflows/AAGF-WF-001.md`
- Стало: `.aiassistant/rules/workflows/AAGF-WF-001-plan-first-change-workflow.md`

- Было: `.cursor/rules/workflows/AAGF-WF-001.md`
- Стало: `.cursor/rules/workflows/AAGF-WF-001-plan-first-change-workflow.mdc`

## Обязательные действия при обновлении

1. Перегенерируй артефакты:
   - `npm run docs:generate`
2. Проверь drift:
   - `npm run docs:check`
3. Проверь runtime sync в dry-run:
   - `npm run docs:sync:check -- --target all`
4. Примени sync только после подтверждения:
   - `npm run docs:sync -- --target all`

## Совместимость

- Legacy-файлы со старым неймингом считаются drift.
- В `sync` включена операция `DELETE` для удаления устаревших runtime-артефактов.
