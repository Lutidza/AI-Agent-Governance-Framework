# Инструкция По Развертыванию AAGF В Целевом Проекте

Используй этот файл как единственный runbook установки для AI-агента.
Не дублируй команды из других файлов и не пропускай шаги.

Выбери и выполни один из двух сценариев:

- Ubuntu (`bash`)
- Windows (`PowerShell`)
- Migration notes по неймингу rules: [`rules-migration-notes.md`](./rules-migration-notes.md)

## Общий Операционный Контракт

- Выполняй workflow строго по фазам `Install -> Detect -> Confirm -> Compose -> Generate -> Sync -> Lock`.
- Выполняй фазу `Detect` только через MCP tool `detect_stack_deep`.
- Публикуй `detect-started` и structured summary (`stack.*`, `unknown-levels`, `low-confidence`).
- Проходи explicit gate `confirm` или `edit` перед `Lock`.
- Используй подтвержденный `aagf/docs/spec/project/stack-context.yaml` как runtime-контекст.
- Выполняй `docs:sync` только после `docs:sync:check` и явного подтверждения пользователя.

## Ubuntu (Bash)

1. Подключи `aagf/` в корень целевого проекта:

```bash
git clone --filter=blob:none --sparse https://github.com/Lutidza/AI-Agent-Governance-Framework.git .aagf-src
cd .aagf-src
git sparse-checkout init --cone
git sparse-checkout set aagf
git checkout main
cd ..
cp -R .aagf-src/aagf ./aagf
rm -rf .aagf-src
```

2. Установи зависимости и проверь source-слой:

```bash
cd aagf
npm install
npm run docs:validate
```

3. Запусти dry-run детекции:

```bash
npm run docs:detect-stack
```

4. Пройди Confirm gate:

```bash
# confirm (рекомендуется)
npm run docs:bootstrap -- --guided --detect-action confirm

# edit (пример ручной коррекции)
npm run docs:bootstrap -- --guided --detect-action edit --detect-selected-stack node-typescript --detect-edit '{level: frameworks, action: add, item: {id: react, version: "^19.0.0", confidence: 0.9, evidence: ["manual edit"]}}'
```

5. Примени изменения (apply-фаза):

```bash
# confirm apply
npm run docs:bootstrap -- --guided --apply --detect-action confirm

# edit apply
npm run docs:bootstrap -- --guided --apply --detect-action edit --detect-selected-stack node-typescript --detect-edit '{level: frameworks, action: add, item: {id: react, version: "^19.0.0", confidence: 0.9, evidence: ["manual edit"]}}'
```

6. Выполни проверки и sync:

```bash
npm run docs:test -- --target all
npm run docs:check -- --target all
npm run docs:sync:check -- --target all
npm run docs:sync -- --target all
```

## Windows (PowerShell)

1. Подключи `aagf/` в корень целевого проекта:

```powershell
git clone --filter=blob:none --sparse https://github.com/Lutidza/AI-Agent-Governance-Framework.git .aagf-src
Set-Location .aagf-src
git sparse-checkout init --cone
git sparse-checkout set aagf
git checkout main
Set-Location ..
Copy-Item -Recurse -Force .aagf-src\aagf .\aagf
Remove-Item -Recurse -Force .aagf-src
```

2. Установи зависимости и проверь source-слой:

```powershell
Set-Location .\aagf
npm.cmd install
npm.cmd run docs:validate
```

3. Запусти dry-run детекции:

```powershell
npm.cmd run docs:detect-stack
```

4. Пройди Confirm gate:

```powershell
# confirm (рекомендуется)
npm.cmd run docs:bootstrap -- --guided --detect-action confirm

# edit (пример ручной коррекции)
npm.cmd run docs:bootstrap -- --guided --detect-action edit --detect-selected-stack node-typescript --detect-edit '{level: frameworks, action: add, item: {id: react, version: "^19.0.0", confidence: 0.9, evidence: ["manual edit"]}}'
```

5. Примени изменения (apply-фаза):

```powershell
# confirm apply
npm.cmd run docs:bootstrap -- --guided --apply --detect-action confirm

# edit apply
npm.cmd run docs:bootstrap -- --guided --apply --detect-action edit --detect-selected-stack node-typescript --detect-edit '{level: frameworks, action: add, item: {id: react, version: "^19.0.0", confidence: 0.9, evidence: ["manual edit"]}}'
```

6. Выполни проверки и sync:

```powershell
npm.cmd run docs:test -- --target all
npm.cmd run docs:check -- --target all
npm.cmd run docs:sync:check -- --target all
npm.cmd run docs:sync -- --target all
```

## Обязательные Артефакты После Apply

- `aagf/docs/spec/project/stack-context.yaml`
- `aagf/docs/spec/project/stack-overrides.yaml` (если использован `edit`)
- `aagf/docs/spec/project/stack-detection.yaml`
- `aagf/docs/spec/project/context.yaml`
- `aagf/docs/spec/project/profile.lock.yaml`
- `AGENTS.md` в корне целевого проекта (из `aagf/docs/install/AGENTS.md`)
- `.aiassistant/rules/README.md` и `.aiassistant/rules/<section>/<rule-id>-<file-slug>.md`
- `.cursor/rules/README.md` и `.cursor/rules/<section>/<rule-id>-<file-slug>.mdc`

## Типовые Проблемы

- IF `docs:detect-stack` возвращает `decision=unknown` или low-confidence THEN используй `--detect-action edit` и зафиксируй `--detect-selected-stack`.
- IF `docs:sync:check` показывает `CREATE/UPDATE` на первом прогоне THEN считай это ожидаемым до первого `docs:sync`.
- IF в Windows `npm` блокируется policy/alias THEN используй `npm.cmd`.
- IF целевой каталог не является git-репозиторием THEN выполни `git init` или работай в клонированном репозитории, если нужен commit/push.

## Подсказка Для Уже Установленного AAGF

Если AAGF уже установлен, используй следующий промпт:

> Проанализируй файл README.md в этом репозитории и интегрируй AAGF в текущий проект.
