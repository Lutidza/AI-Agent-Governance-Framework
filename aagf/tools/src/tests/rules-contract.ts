import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const KIT_ROOT = process.cwd();

function isMarkdownRuleEntry(fileName: string): boolean {
  return fileName !== "README.md";
}

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

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function assertModularIndexes(): Promise<void> {
  const requiredIndexes = [
    "docs/spec/core/rules.index.yaml",
    "docs/spec/stacks/rules.index.yaml",
    "docs/spec/workflows/rules.index.yaml",
    "docs/spec/roles/rules.index.yaml",
    "docs/spec/adapters/rules.index.yaml"
  ];

  for (const relPath of requiredIndexes) {
    const absPath = path.join(KIT_ROOT, relPath);
    try {
      await readFile(absPath, "utf8");
    } catch {
      throw new Error(`rules-contract: missing modular index '${relPath}'.`);
    }
  }
}

async function assertJetBrainsNaming(): Promise<void> {
  const rulesDir = path.join(KIT_ROOT, "docs/adapters/jetbrains/runtime/.aiassistant/rules");
  const files = await collectFiles(rulesDir);

  for (const relPath of files) {
    const fileName = path.posix.basename(relPath);
    if (!isMarkdownRuleEntry(fileName)) {
      continue;
    }

    assert(
      /^AAGF-[A-Z0-9-]+-[a-z0-9-]+\.md$/.test(fileName),
      `rules-contract: invalid jetbrains rule filename '${relPath}'.`
    );

    assert(
      !/^[A-Z0-9-]+\.md$/.test(fileName),
      `rules-contract: legacy jetbrains rule filename detected '${relPath}'.`
    );
  }
}

async function assertCursorNamingAndFrontmatter(): Promise<void> {
  const rulesDir = path.join(KIT_ROOT, "docs/adapters/cursor/runtime/.cursor/rules");
  const files = await collectFiles(rulesDir);
  const entryFiles = files.filter((relPath) => path.posix.basename(relPath) !== "README.md");

  for (const relPath of entryFiles) {
    const fileName = path.posix.basename(relPath);
    assert(
      /^AAGF-[A-Z0-9-]+-[a-z0-9-]+\.mdc$/.test(fileName),
      `rules-contract: invalid cursor rule filename '${relPath}'.`
    );

    const content = await readFile(path.join(rulesDir, ...relPath.split("/")), "utf8");
    assert(
      content.trimStart().startsWith("---"),
      `rules-contract: cursor rule '${relPath}' must start with frontmatter.`
    );
  }
}

async function assertRulesReadmeLinks(rootRulesDir: string): Promise<void> {
  const readmePath = path.join(rootRulesDir, "README.md");
  const readmeContent = await readFile(readmePath, "utf8");
  const linkPattern = /\(\.\/([^)]+)\)/g;
  const links = [...readmeContent.matchAll(linkPattern)].map((match) => match[1]);

  for (const relLinkPath of links) {
    const targetPath = path.join(rootRulesDir, ...relLinkPath.split("/"));
    try {
      const targetStat = await stat(targetPath);
      assert(
        targetStat.isFile(),
        `rules-contract: README link '${relLinkPath}' does not point to a file.`
      );
    } catch {
      throw new Error(`rules-contract: README contains broken link '${relLinkPath}'.`);
    }
  }
}

async function main(): Promise<void> {
  await assertModularIndexes();
  await assertJetBrainsNaming();
  await assertCursorNamingAndFrontmatter();
  await assertRulesReadmeLinks(
    path.join(KIT_ROOT, "docs/adapters/jetbrains/runtime/.aiassistant/rules")
  );
  await assertRulesReadmeLinks(path.join(KIT_ROOT, "docs/adapters/cursor/runtime/.cursor/rules"));
  console.log("rules-contract: all checks passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
