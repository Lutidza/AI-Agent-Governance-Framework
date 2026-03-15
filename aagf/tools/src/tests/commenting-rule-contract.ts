import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import YAML from "yaml";

type CommentProfileCatalog = {
  profiles: CommentProfile[];
};

type CommentProfile = {
  id: string;
  doc_style: string;
  required_metadata: string[];
  required_semantic_tags: string[];
  metadata_header?: {
    changes_block_tag?: string;
  };
  policy?: {
    todo_fixme?: string;
  };
};

type ValidationIssue = {
  filePath: string;
  code:
    | "missing-file-header"
    | "missing-metadata-tag"
    | "metadata-order"
    | "missing-version-changes-block"
    | "missing-function-doc"
    | "missing-required-tag"
    | "todo-fixme-without-task-ref";
  message: string;
};

type ParsedArgs = {
  targetDir: string | null;
  profileId: string;
};

type ContractCase = {
  name: string;
  relDir: string;
  expected: "pass" | "fail";
  mustContainCode?: ValidationIssue["code"];
};

const KIT_ROOT = process.cwd();
const PROFILES_PATH = path.join(KIT_ROOT, "docs/spec/stacks/comment-doc-profiles.yaml");
const FIXTURE_ROOT = path.join(KIT_ROOT, "tools/src/tests/fixtures/commenting-rule-lab");
const DEFAULT_PROFILE_ID = "node-typescript.tsdoc-v1";
const TASK_REF_PATTERN = /\b(?:TASK-\d+|#\d+|AAGF-[A-Z0-9-]+)\b/;

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = {
    targetDir: null,
    profileId: DEFAULT_PROFILE_ID
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--target-dir") {
      parsed.targetDir = argv[i + 1] ?? null;
      i += 1;
      continue;
    }

    if (token === "--profile") {
      parsed.profileId = argv[i + 1] ?? DEFAULT_PROFILE_ID;
      i += 1;
      continue;
    }
  }

  return parsed;
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function readCatalog(): Promise<CommentProfileCatalog> {
  const raw = await readFile(PROFILES_PATH, "utf8");
  const parsed = YAML.parse(raw) as CommentProfileCatalog;
  assert(
    Array.isArray(parsed.profiles) && parsed.profiles.length > 0,
    "commenting-rule-contract: profiles catalog is empty."
  );
  return parsed;
}

function resolveProfile(catalog: CommentProfileCatalog, profileId: string): CommentProfile {
  const profile = catalog.profiles.find((item) => item.id === profileId);
  if (!profile) {
    const known = catalog.profiles.map((item) => item.id).join(", ");
    throw new Error(
      `commenting-rule-contract: unknown profile '${profileId}'. Known profiles: ${known}`
    );
  }
  return profile;
}

async function collectFiles(rootDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(absDir: string): Promise<void> {
    const entries = await readdir(absDir, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absPath = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (![".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
        continue;
      }

      files.push(absPath);
    }
  }

  await walk(rootDir);
  return files;
}

function getHeaderDocBlock(content: string): string | null {
  const trimmed = content.replace(/^\uFEFF/, "").trimStart();
  const blockMatch = trimmed.match(/^\/\*\*[\s\S]*?\*\//);
  if (blockMatch) {
    return blockMatch[0];
  }

  const lineDocMatch = trimmed.match(/^(?:\/\/\/[^\n]*\n)+/);
  if (lineDocMatch) {
    return lineDocMatch[0];
  }

  return null;
}

function verifyMetadataOrder(header: string, required: string[]): boolean {
  let cursor = -1;
  for (const tag of required) {
    const next = header.indexOf(`@${tag}`);
    if (next === -1 || next < cursor) {
      return false;
    }
    cursor = next;
  }
  return true;
}

type FunctionCandidate = {
  signature: string;
  index: number;
  paramsCount: number;
  requiresReturnsTag: boolean;
};

function countParams(signature: string): number {
  const open = signature.indexOf("(");
  const close = signature.indexOf(")", open + 1);
  if (open === -1 || close === -1) {
    return 0;
  }

  const body = signature.slice(open + 1, close).trim();
  if (!body) {
    return 0;
  }
  return body
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0).length;
}

function inferReturnsTagRequirement(signature: string): boolean {
  const hasVoidReturn = /:\s*(?:Promise<\s*void\s*>|void)\b/.test(signature);
  return !hasVoidReturn;
}

function findFunctionCandidates(content: string): FunctionCandidate[] {
  const result: FunctionCandidate[] = [];
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\([^)]*\)\s*(?::\s*[^({=>]+)?\s*\{/g,
    /(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][A-Za-z0-9_$]*\s*=\s*(?:async\s*)?\([^)]*\)\s*(?::\s*[^=]+)?=>\s*\{/g
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(content);
    while (match) {
      const signature = match[0];
      result.push({
        signature,
        index: match.index,
        paramsCount: countParams(signature),
        requiresReturnsTag: inferReturnsTagRequirement(signature)
      });
      match = pattern.exec(content);
    }
  }

  result.sort((a, b) => a.index - b.index);
  return result;
}

function findNearestDocBlockBefore(content: string, index: number): string | null {
  const start = Math.max(0, index - 1200);
  const segment = content.slice(start, index);
  const docMatch = segment.match(/\/\*\*[\s\S]*?\*\/\s*$/);
  return docMatch ? docMatch[0] : null;
}

function validateFileContent(
  filePath: string,
  content: string,
  profile: CommentProfile
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const header = getHeaderDocBlock(content);

  if (!header) {
    issues.push({
      filePath,
      code: "missing-file-header",
      message: "Не найден header-doc блок файла с @file/@version/@edited_at."
    });
  } else {
    for (const tag of profile.required_metadata ?? []) {
      if (!new RegExp(`@${tag}\\b`).test(header)) {
        issues.push({
          filePath,
          code: "missing-metadata-tag",
          message: `В header-докблоке отсутствует тег @${tag}.`
        });
      }
    }

    if (profile.required_metadata?.length) {
      const ordered = verifyMetadataOrder(header, profile.required_metadata);
      if (!ordered) {
        issues.push({
          filePath,
          code: "metadata-order",
          message:
            "Порядок required metadata в header нарушен (ожидается порядок из active profile)."
        });
      }
    }

    const changesTag = profile.metadata_header?.changes_block_tag;
    if (changesTag && !header.includes(changesTag)) {
      issues.push({
        filePath,
        code: "missing-version-changes-block",
        message: `В header отсутствует блок изменений текущей версии (${changesTag}).`
      });
    }
  }

  const functionCandidates = findFunctionCandidates(content);
  for (const candidate of functionCandidates) {
    const doc = findNearestDocBlockBefore(content, candidate.index);
    if (!doc) {
      issues.push({
        filePath,
        code: "missing-function-doc",
        message: "У изменяемой функции/метода отсутствует профильный doc-комментарий."
      });
      continue;
    }

    if (candidate.paramsCount > 0 && !/@param\b/.test(doc)) {
      issues.push({
        filePath,
        code: "missing-required-tag",
        message: "Для функции с параметрами отсутствует тег @param."
      });
    }

    if (candidate.requiresReturnsTag && !/@returns?\b/.test(doc)) {
      issues.push({
        filePath,
        code: "missing-required-tag",
        message: "Для функции с результатом отсутствует тег @returns."
      });
    }

    if (!/@remarks\b/.test(doc)) {
      issues.push({
        filePath,
        code: "missing-required-tag",
        message: "В doc-комментарии отсутствует тег @remarks."
      });
    }
  }

  if (profile.policy?.todo_fixme === "require_reason_and_task_ref") {
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (!/\b(?:TODO|FIXME)\b/.test(line)) {
        return;
      }

      if (!TASK_REF_PATTERN.test(line)) {
        issues.push({
          filePath,
          code: "todo-fixme-without-task-ref",
          message: `Строка ${index + 1}: TODO/FIXME без task reference.`
        });
      }
    });
  }

  return issues;
}

async function validateDirectory(rootDir: string, profile: CommentProfile): Promise<ValidationIssue[]> {
  const files = await collectFiles(rootDir);
  const issues: ValidationIssue[] = [];

  for (const filePath of files) {
    const content = await readFile(filePath, "utf8");
    issues.push(...validateFileContent(filePath, content, profile));
  }

  return issues;
}

function printIssues(issues: ValidationIssue[]): void {
  if (issues.length === 0) {
    console.log("commenting-rule-contract: no violations.");
    return;
  }

  console.error(`commenting-rule-contract: found violations=${issues.length}`);
  for (const issue of issues) {
    const relPath = path.relative(KIT_ROOT, issue.filePath).replace(/\\/g, "/");
    console.error(` - [${issue.code}] ${relPath}: ${issue.message}`);
  }
}

function hasIssueCode(issues: ValidationIssue[], code: ValidationIssue["code"]): boolean {
  return issues.some((issue) => issue.code === code);
}

async function runContractSuite(profile: CommentProfile): Promise<void> {
  const cases: ContractCase[] = [
    {
      name: "pass-valid",
      relDir: "pass",
      expected: "pass"
    },
    {
      name: "fail-missing-header",
      relDir: "fail/missing-header",
      expected: "fail",
      mustContainCode: "missing-file-header"
    },
    {
      name: "fail-missing-function-doc",
      relDir: "fail/missing-function-doc",
      expected: "fail",
      mustContainCode: "missing-function-doc"
    },
    {
      name: "fail-todo-without-task-ref",
      relDir: "fail/todo-without-task-ref",
      expected: "fail",
      mustContainCode: "todo-fixme-without-task-ref"
    }
  ];

  for (const contractCase of cases) {
    const absDir = path.join(FIXTURE_ROOT, contractCase.relDir);
    const issues = await validateDirectory(absDir, profile);

    if (contractCase.expected === "pass" && issues.length > 0) {
      printIssues(issues);
      throw new Error(`commenting-rule-contract: case='${contractCase.name}' expected PASS.`);
    }

    if (contractCase.expected === "fail" && issues.length === 0) {
      throw new Error(`commenting-rule-contract: case='${contractCase.name}' expected FAIL.`);
    }

    if (contractCase.mustContainCode && !hasIssueCode(issues, contractCase.mustContainCode)) {
      printIssues(issues);
      throw new Error(
        `commenting-rule-contract: case='${contractCase.name}' expected code '${contractCase.mustContainCode}'.`
      );
    }

    console.log(`commenting-rule-contract: case='${contractCase.name}' passed.`);
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const catalog = await readCatalog();
  const profile = resolveProfile(catalog, args.profileId);

  if (args.targetDir) {
    const absoluteTarget = path.isAbsolute(args.targetDir)
      ? args.targetDir
      : path.resolve(KIT_ROOT, args.targetDir);
    const issues = await validateDirectory(absoluteTarget, profile);
    printIssues(issues);
    if (issues.length > 0) {
      process.exitCode = 1;
    }
    return;
  }

  await runContractSuite(profile);
  console.log("commenting-rule-contract: all fixture cases passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
