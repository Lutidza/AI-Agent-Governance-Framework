/**
 * @file tools/src/tests/rules-contract.ts
 * @version 1.1.0
 * @edited_at 2026-03-15 20:05
 * Контрактные проверки для generated-правил JetBrains/Cursor и модульных индексов source-слоя.
 * @remarks Изменения в версии 1.1.0: добавлены langDoc-комментарии и локальная структурная декомпозиция без изменения поведения теста.
 */
import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const KIT_ROOT = process.cwd();
const MODULAR_INDEX_PATHS = [
  "docs/spec/core/rules.index.yaml",
  "docs/spec/stacks/rules.index.yaml",
  "docs/spec/workflows/rules.index.yaml",
  "docs/spec/roles/rules.index.yaml",
  "docs/spec/adapters/rules.index.yaml"
];
const JETBRAINS_RULES_DIR = path.join(KIT_ROOT, "docs/adapters/jetbrains/runtime/.aiassistant/rules");
const CURSOR_RULES_DIR = path.join(KIT_ROOT, "docs/adapters/cursor/runtime/.cursor/rules");

/**
 * Определяет, является ли файл служебным README и должен ли быть исключен из проверки entry-файлов.
 * @param fileName Имя файла в каталоге правил.
 * @returns `true`, если это entry-файл, который нужно валидировать как правило.
 * @remarks README используется как индекс, а не как rule-entry.
 */
function isRuleEntryFile(fileName: string): boolean {
  return fileName !== "README.md";
}

/**
 * Рекурсивно собирает список файлов относительно указанной директории.
 * @param rootDir Абсолютный путь до корня обхода.
 * @returns Список относительных путей всех файлов.
 * @throws Error Пробрасывает системные ошибки чтения файловой системы.
 * @remarks Порядок обхода детерминирован через сортировку имен в каждом каталоге.
 */
async function collectFiles(rootDir: string): Promise<string[]> {
  const result: string[] = [];

  async function walk(absDir: string, relDir: string): Promise<void> {
    const entries = await readdir(absDir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absPath = path.join(absDir, entry.name);
      const relPath = relDir ? `${relDir}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        await walk(absPath, relPath);
        continue;
      }

      if (entry.isFile()) {
        result.push(relPath);
      }
    }
  }

  await walk(rootDir, "");
  return result;
}

/**
 * Бросает исключение при нарушении контрактного условия.
 * @param condition Проверяемое булево условие.
 * @param message Текст ошибки контракта.
 * @returns `void`.
 * @throws Error Если условие ложно.
 * @remarks Используется как единая точка формирования fail-fast ошибок в тесте.
 */
function assertCondition(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Проверяет наличие всех обязательных модульных индексов rules в source-слое.
 * @returns `void`.
 * @throws Error Если любой из обязательных index-файлов отсутствует.
 * @remarks Проверка гарантирует, что секции rules остаются в модульном формате.
 */
async function assertModularIndexes(): Promise<void> {
  for (const relPath of MODULAR_INDEX_PATHS) {
    const absPath = path.join(KIT_ROOT, relPath);
    try {
      await readFile(absPath, "utf8");
    } catch {
      throw new Error(`rules-contract: missing modular index '${relPath}'.`);
    }
  }
}

/**
 * Проверяет naming-конвенцию rule-entry файлов для JetBrains-адаптера.
 * @returns `void`.
 * @throws Error Если имя entry-файла не соответствует контракту.
 * @remarks Формат имени: `AAGF-<RULE-ID>-<file-slug>.md`.
 */
async function assertJetBrainsNaming(): Promise<void> {
  const files = await collectFiles(JETBRAINS_RULES_DIR);

  for (const relPath of files) {
    const fileName = path.posix.basename(relPath);
    if (!isRuleEntryFile(fileName)) {
      continue;
    }

    assertCondition(
      /^AAGF-[A-Z0-9-]+-[a-z0-9-]+\.md$/.test(fileName),
      `rules-contract: invalid jetbrains rule filename '${relPath}'.`
    );

    assertCondition(
      !/^[A-Z0-9-]+\.md$/.test(fileName),
      `rules-contract: legacy jetbrains rule filename detected '${relPath}'.`
    );
  }
}

/**
 * Проверяет naming-конвенцию и frontmatter для Cursor rule-entry файлов.
 * @returns `void`.
 * @throws Error Если имя файла не соответствует контракту или отсутствует frontmatter.
 * @remarks Формат имени: `AAGF-<RULE-ID>-<file-slug>.mdc`, frontmatter должен начинаться с `---`.
 */
async function assertCursorNamingAndFrontmatter(): Promise<void> {
  const files = await collectFiles(CURSOR_RULES_DIR);
  const entryFiles = files.filter((relPath) => isRuleEntryFile(path.posix.basename(relPath)));

  for (const relPath of entryFiles) {
    const fileName = path.posix.basename(relPath);
    assertCondition(
      /^AAGF-[A-Z0-9-]+-[a-z0-9-]+\.mdc$/.test(fileName),
      `rules-contract: invalid cursor rule filename '${relPath}'.`
    );

    const content = await readFile(path.join(CURSOR_RULES_DIR, ...relPath.split("/")), "utf8");
    assertCondition(
      content.trimStart().startsWith("---"),
      `rules-contract: cursor rule '${relPath}' must start with frontmatter.`
    );
  }
}

/**
 * Проверяет, что все относительные ссылки в README каталога правил разрешаются в существующие файлы.
 * @param rootRulesDir Абсолютный путь к каталогу `rules`, содержащему `README.md`.
 * @returns `void`.
 * @throws Error Если ссылка из README битая или указывает не на файл.
 * @remarks Анализируются только ссылки вида `(./relative/path)`.
 */
async function assertRulesReadmeLinks(rootRulesDir: string): Promise<void> {
  const readmePath = path.join(rootRulesDir, "README.md");
  const readmeContent = await readFile(readmePath, "utf8");
  const linkPattern = /\(\.\/([^)]+)\)/g;
  const links = [...readmeContent.matchAll(linkPattern)].map((match) => match[1]);

  for (const relLinkPath of links) {
    const targetPath = path.join(rootRulesDir, ...relLinkPath.split("/"));
    try {
      const targetStat = await stat(targetPath);
      assertCondition(
        targetStat.isFile(),
        `rules-contract: README link '${relLinkPath}' does not point to a file.`
      );
    } catch {
      throw new Error(`rules-contract: README contains broken link '${relLinkPath}'.`);
    }
  }
}

/**
 * Выполняет полный контрактный прогон проверок rules-контура.
 * @returns `void`.
 * @throws Error Если любая из контрактных проверок завершилась ошибкой.
 * @remarks Порядок проверок фиксирован для стабильности диагностики.
 */
async function main(): Promise<void> {
  await assertModularIndexes();
  await assertJetBrainsNaming();
  await assertCursorNamingAndFrontmatter();
  await assertRulesReadmeLinks(JETBRAINS_RULES_DIR);
  await assertRulesReadmeLinks(CURSOR_RULES_DIR);
  console.log("rules-contract: all checks passed.");
}

/**
 * Точка входа процесса с нормализованным текстом ошибки и корректным exit code.
 * @returns `void`.
 * @remarks Не перехватывает ошибку глубже, чтобы не скрывать причину contract-fail.
 */
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
