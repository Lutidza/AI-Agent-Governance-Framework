import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import type { ErrorObject } from "ajv";
import Ajv2020 from "ajv/dist/2020";
import nunjucks from "nunjucks";
import YAML from "yaml";

type IfThenRule = {
  if: string;
  then: string;
};

type PromptBlueprint = {
  id: string;
  title: string;
  objective: string;
  template: string;
};

type SectionEntry = {
  id: string;
  title: string;
  intent: string;
  rules: string[];
  if_then: IfThenRule[];
  checks: string[];
  steps?: string[];
  handoff?: string[];
  prompts?: PromptBlueprint[];
};

type SectionSpec = {
  section: string;
  version: number;
  entries: SectionEntry[];
};

type RuleModuleSpec = {
  version: number;
  section: string;
  entry: SectionEntry;
};

type RulesIndexEntry = {
  id: string;
  source: string;
};

type RulesIndexSpec = {
  section: string;
  version: number;
  mode: "modular";
  entries: RulesIndexEntry[];
};

type Section = {
  id: string;
  title: string;
  description: string;
  source: string;
  spec_data: string;
  target_human: string;
};

type EnrichedSection = Section & {
  source_content: string;
  spec: SectionSpec;
};

type GeneratorTarget = {
  id: string;
  title: string;
  adapter_root: string;
  runtime_dir: string;
  runtime_rules: string;
  runtime_prompts: string;
};

type DocsManifest = {
  id: string;
  version: string;
  status: "draft" | "active" | "deprecated";
  language: "ru" | "en";
  source_of_truth: {
    primary: string;
    derived: string[];
  };
  rule_precedence: string[];
  sections: Section[];
  generators: {
    human_root: string;
    targets: GeneratorTarget[];
  };
};

type CliOptions = {
  target: string;
  projectRoot: string;
  check: boolean;
  apply: boolean;
  guided: boolean;
  confirmDetection: boolean;
  sync: boolean;
  confirmSync: boolean;
  enablePacks: string[];
  disablePacks: string[];
};

type DetectionDecision = "auto" | "confirm" | "unknown";

type MarkerScope = "dependencies" | "devDependencies" | "any";

type StackFileMarker = {
  path: string;
  weight: number;
  evidence: string;
};

type StackPackageMarker = {
  dependency: string;
  scope?: MarkerScope;
  weight: number;
  evidence: string;
};

type StackCandidate = {
  id: string;
  title: string;
  file_markers?: StackFileMarker[];
  package_markers?: StackPackageMarker[];
};

type StackDetectionSpec = {
  version: number;
  mode?: "dry-run" | "apply";
  thresholds: {
    auto: number;
    confirm: number;
  };
  candidates: StackCandidate[];
  last_result?: {
    selected_stack: string;
    confidence: number;
    decision: DetectionDecision;
    evidence: string[];
    recommendation: string;
  };
};

type RankedCandidate = {
  id: string;
  title: string;
  confidence: number;
  evidence: string[];
};

type StackDetectionOutcome = {
  selectedStack: string;
  confidence: number;
  decision: DetectionDecision;
  evidence: string[];
  recommendation: string;
  ranked: RankedCandidate[];
  matchedFiles: string[];
};

type EnabledPackEntry = {
  id: string;
  type: string;
  enabled: boolean;
};

type EnabledPacksSpec = {
  version: number;
  default_target?: string;
  packs: EnabledPackEntry[];
  policies?: Record<string, unknown>;
};

type ProjectContextSpec = {
  version: number;
  status: string;
  project: {
    id: string;
    root: string;
    docs_installed: boolean;
    root_agents: {
      mode: string;
      overwrite: boolean;
    };
  };
  facts: {
    files_present: string[];
    package_managers: string[];
    languages: string[];
    runtimes: {
      jetbrains: string;
      cursor: string;
    };
  };
  detection: {
    selected_stack: string;
    confidence: number;
    decision: DetectionDecision;
    evidence: string[];
  };
  governance: {
    active_commenting_profile: string;
    commenting_profiles_ref: string;
  };
  notes?: string[];
};

type ProfileLockSpec = {
  version: number;
  locked: boolean;
  profile_id: string;
  detected_stack: {
    id: string;
    confidence: number;
    decision: DetectionDecision;
  };
  enabled_packs: string[];
  overrides_ref: string;
  generated_targets: string[];
  root_agents: {
    mode: string;
    overwrite: boolean;
    confirmed: boolean;
  };
  governance: {
    active_commenting_profile: string;
    commenting_profiles_ref: string;
  };
};

type SyncOperation = {
  kind: "create" | "update";
  relPath: string;
  destPath: string;
  content: string;
};

type SyncPlan = {
  target: GeneratorTarget;
  sourceDir: string;
  destinationDir: string;
  operations: SyncOperation[];
  unchangedCount: number;
};

const KIT_ROOT = process.cwd();
const MANIFEST_PATH = path.join(KIT_ROOT, "docs/spec/manifests/docs.manifest.yaml");
const MANIFEST_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/docs-manifest.schema.json");
const SECTION_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/section-spec.schema.json");
const RULE_MODULE_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/rule-module.schema.json");
const RULES_INDEX_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/rules-index.schema.json");
const TEMPLATE_DIR = path.join(KIT_ROOT, "tools/templates");
const PROJECT_SPEC_DIR = path.join(KIT_ROOT, "docs/spec/project");
const PROJECT_CONTEXT_PATH = path.join(PROJECT_SPEC_DIR, "context.yaml");
const PROJECT_STACK_DETECTION_PATH = path.join(PROJECT_SPEC_DIR, "stack-detection.yaml");
const PROJECT_ENABLED_PACKS_PATH = path.join(PROJECT_SPEC_DIR, "enabled-packs.yaml");
const PROJECT_OVERRIDES_PATH = path.join(PROJECT_SPEC_DIR, "overrides.yaml");
const PROJECT_PROFILE_LOCK_PATH = path.join(PROJECT_SPEC_DIR, "profile.lock.yaml");
const COMMENTING_PROFILES_REF = "aagf/docs/spec/stacks/comment-doc-profiles.yaml";

function normalizeText(input: string): string {
  return input.replace(/\r\n/g, "\n").trimEnd() + "\n";
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  return (errors ?? [])
    .map((error) => `${error.instancePath || "/"}: ${error.message}`)
    .join("\n");
}

async function readYamlFile<T>(filePath: string): Promise<T> {
  const raw = await readFile(filePath, "utf8");
  return YAML.parse(raw) as T;
}

async function writeYamlFile(filePath: string, payload: unknown): Promise<void> {
  const content = YAML.stringify(payload);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, normalizeText(content), "utf8");
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readYamlFileOrDefault<T>(filePath: string, fallback: T): Promise<T> {
  if (!(await pathExists(filePath))) {
    return fallback;
  }

  return readYamlFile<T>(filePath);
}

function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function resolveProjectRoot(projectRootOption: string): string {
  if (path.isAbsolute(projectRootOption)) {
    return projectRootOption;
  }
  return path.resolve(KIT_ROOT, projectRootOption);
}

async function validateAgainstSchema(
  schemaPath: string,
  payload: unknown,
  label: string
): Promise<void> {
  const schema = JSON.parse(await readFile(schemaPath, "utf8")) as object;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  if (!validate(payload)) {
    throw new Error(`${label} validation failed:\n${formatAjvErrors(validate.errors)}`);
  }
}

async function readManifest(): Promise<DocsManifest> {
  const manifest = await readYamlFile<DocsManifest>(MANIFEST_PATH);
  await validateAgainstSchema(MANIFEST_SCHEMA_PATH, manifest, MANIFEST_PATH);

  const targetIds = new Set<string>();
  for (const target of manifest.generators.targets) {
    if (targetIds.has(target.id)) {
      throw new Error(`Manifest contains duplicated target id: '${target.id}'.`);
    }
    targetIds.add(target.id);
  }

  return manifest;
}

async function loadSections(manifest: DocsManifest): Promise<EnrichedSection[]> {
  const sections: EnrichedSection[] = [];

  for (const section of manifest.sections) {
    const sourcePath = path.join(KIT_ROOT, section.source);
    const specDataPath = path.join(KIT_ROOT, section.spec_data);

    const sourceContent = (await readFile(sourcePath, "utf8")).trim();
    const rawSpec = await readYamlFile<Record<string, unknown>>(specDataPath);
    let spec: SectionSpec;

    if (isRulesIndexSpec(rawSpec)) {
      await validateAgainstSchema(RULES_INDEX_SCHEMA_PATH, rawSpec, section.spec_data);
      spec = await loadModularSectionSpec(section, rawSpec);
    } else {
      spec = rawSpec as SectionSpec;
      await validateAgainstSchema(SECTION_SCHEMA_PATH, spec, section.spec_data);

      if (spec.section !== section.id) {
        throw new Error(
          `Section mismatch: ${section.spec_data} declares section='${spec.section}', expected '${section.id}'.`
        );
      }
    }

    sections.push({
      ...section,
      source_content: sourceContent,
      spec
    });
  }

  return sections;
}

function isRulesIndexSpec(payload: unknown): payload is RulesIndexSpec {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Partial<RulesIndexSpec>;
  return candidate.mode === "modular";
}

async function loadModularSectionSpec(
  section: Section,
  rulesIndex: RulesIndexSpec
): Promise<SectionSpec> {
  if (rulesIndex.section !== section.id) {
    throw new Error(
      `Section mismatch: ${section.spec_data} declares section='${rulesIndex.section}', expected '${section.id}'.`
    );
  }

  const entries: SectionEntry[] = [];
  const seenIds = new Set<string>();

  for (const indexEntry of rulesIndex.entries) {
    if (seenIds.has(indexEntry.id)) {
      throw new Error(
        `Rules index '${section.spec_data}' contains duplicate entry id '${indexEntry.id}'.`
      );
    }

    const modulePath = path.join(KIT_ROOT, indexEntry.source);
    const moduleSpec = await readYamlFile<RuleModuleSpec>(modulePath);
    await validateAgainstSchema(RULE_MODULE_SCHEMA_PATH, moduleSpec, indexEntry.source);

    if (moduleSpec.section !== section.id) {
      throw new Error(
        `Rule module '${indexEntry.source}' declares section='${moduleSpec.section}', expected '${section.id}'.`
      );
    }

    if (moduleSpec.entry.id !== indexEntry.id) {
      throw new Error(
        `Rules index id mismatch: index has '${indexEntry.id}', but module '${indexEntry.source}' has '${moduleSpec.entry.id}'.`
      );
    }

    entries.push(moduleSpec.entry);
    seenIds.add(indexEntry.id);
  }

  return {
    section: rulesIndex.section,
    version: rulesIndex.version,
    entries
  };
}

function buildTemplateEnv(): nunjucks.Environment {
  return nunjucks.configure(TEMPLATE_DIR, {
    autoescape: false,
    noCache: true,
    trimBlocks: true,
    lstripBlocks: true
  });
}

function toHumanRuntimeDir(runtimeDir: string): string {
  const normalized = runtimeDir.trim().replace(/^[./]+/, "");
  if (!normalized) {
    throw new Error(`Runtime dir '${runtimeDir}' cannot be mapped to human projection path.`);
  }
  return normalized;
}

function buildTemplateContext(manifest: DocsManifest, sections: EnrichedSection[]) {
  const totalEntries = sections.reduce((acc, section) => acc + section.spec.entries.length, 0);
  const totalRules = sections.reduce(
    (acc, section) => acc + section.spec.entries.reduce((inner, entry) => inner + entry.rules.length, 0),
    0
  );
  const totalIfThen = sections.reduce(
    (acc, section) =>
      acc + section.spec.entries.reduce((inner, entry) => inner + entry.if_then.length, 0),
    0
  );

  const workflowPrompts = sections
    .filter((section) => section.id === "workflows")
    .flatMap((section) =>
      section.spec.entries.flatMap((entry) =>
        (entry.prompts ?? []).map((prompt) => ({
          section_id: section.id,
          entry_id: entry.id,
          entry_title: entry.title,
          ...prompt
        }))
      )
    );

  return {
    manifest,
    sections,
    targets_human: manifest.generators.targets.map((target) => ({
      ...target,
      human_runtime_dir: toHumanRuntimeDir(target.runtime_dir)
    })),
    stats: {
      sections: sections.length,
      entries: totalEntries,
      rules: totalRules,
      if_then: totalIfThen,
      prompts: workflowPrompts.length
    },
    workflow_prompts: workflowPrompts
  };
}

function toHumanAdapterPath(adapterPath: string, runtimeDir: string): string {
  const adapterPrefix = "docs/adapters/";

  if (!adapterPath.startsWith(adapterPrefix)) {
    throw new Error(
      `Adapter path '${adapterPath}' must start with '${adapterPrefix}' for human projection mapping.`
    );
  }

  const relativePath = adapterPath.slice(adapterPrefix.length);
  const humanRuntimeDir = toHumanRuntimeDir(runtimeDir);
  const runtimeSegment = `runtime/${runtimeDir}/`;
  const humanRuntimeSegment = `runtime/${humanRuntimeDir}/`;
  const humanRelativePath = relativePath.replace(runtimeSegment, humanRuntimeSegment);

  return `docs/human/adapters/${humanRelativePath}`;
}

function renderOutputs(
  manifest: DocsManifest,
  sections: EnrichedSection[],
  targets: GeneratorTarget[]
): Map<string, string> {
  const env = buildTemplateEnv();
  const outputs = new Map<string, string>();
  const commonContext = buildTemplateContext(manifest, sections);

  outputs.set(
    manifest.generators.human_root,
    env.render("human/root.md.njk", commonContext)
  );

  for (const section of sections) {
    outputs.set(
      section.target_human,
      env.render("human/section.md.njk", {
        ...commonContext,
        section
      })
    );
  }

  for (const target of targets) {
    const humanRuntimeDir = toHumanRuntimeDir(target.runtime_dir);
    const targetContext = {
      ...commonContext,
      target: {
        ...target,
        human_runtime_dir: humanRuntimeDir
      }
    };

    outputs.set(
      target.adapter_root,
      env.render("aiassistant/root.md.njk", targetContext)
    );

    outputs.set(
      target.runtime_rules,
      env.render("aiassistant/rules.md.njk", targetContext)
    );

    outputs.set(
      target.runtime_prompts,
      env.render("aiassistant/prompts.md.njk", targetContext)
    );

    outputs.set(
      toHumanAdapterPath(target.adapter_root, target.runtime_dir),
      env.render("human/adapter-target-root.md.njk", targetContext)
    );

    outputs.set(
      toHumanAdapterPath(target.runtime_rules, target.runtime_dir),
      env.render("human/adapter-target-rules.md.njk", targetContext)
    );

    outputs.set(
      toHumanAdapterPath(target.runtime_prompts, target.runtime_dir),
      env.render("human/adapter-target-prompts.md.njk", targetContext)
    );
  }

  return outputs;
}

async function writeOutputs(outputs: Map<string, string>): Promise<void> {
  for (const [relativePath, content] of outputs.entries()) {
    const absolutePath = path.join(KIT_ROOT, relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, normalizeText(content), "utf8");
  }
}

async function checkDrift(outputs: Map<string, string>): Promise<string[]> {
  const drifted: string[] = [];

  for (const [relativePath, generatedContent] of outputs.entries()) {
    const absolutePath = path.join(KIT_ROOT, relativePath);
    let currentContent = "";

    try {
      currentContent = await readFile(absolutePath, "utf8");
    } catch {
      drifted.push(relativePath);
      continue;
    }

    if (normalizeText(currentContent) !== normalizeText(generatedContent)) {
      drifted.push(relativePath);
    }
  }

  return drifted;
}

function printUsage(): void {
  console.log(
    "Usage: tsx tools/src/cli.ts <validate|generate|check|test|sync|detect-stack|bootstrap> [--target <jetbrains|cursor|all>] [--project-root <path>] [--check] [--apply] [--guided] [--confirm-detection] [--sync] [--confirm-sync] [--enable-pack <id>] [--disable-pack <id>]"
  );
}

function parseCliOptions(argv: string[]): CliOptions {
  let target = "all";
  let projectRoot = "..";
  let check = false;
  let apply = false;
  let guided = false;
  let confirmDetection = false;
  let sync = false;
  let confirmSync = false;
  const enablePacks: string[] = [];
  const disablePacks: string[] = [];

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];

    if (token === "--check") {
      check = true;
      continue;
    }

    if (token === "--apply") {
      apply = true;
      continue;
    }

    if (token === "--guided") {
      guided = true;
      continue;
    }

    if (token === "--confirm-detection") {
      confirmDetection = true;
      continue;
    }

    if (token === "--sync") {
      sync = true;
      continue;
    }

    if (token === "--confirm-sync") {
      confirmSync = true;
      continue;
    }

    if (token === "--enable-pack") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--enable-pack' requires a value.");
      }
      enablePacks.push(value);
      index += 1;
      continue;
    }

    if (token.startsWith("--enable-pack=")) {
      const value = token.slice("--enable-pack=".length).trim();
      if (!value) {
        throw new Error("Option '--enable-pack=' requires a value.");
      }
      enablePacks.push(value);
      continue;
    }

    if (token === "--disable-pack") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--disable-pack' requires a value.");
      }
      disablePacks.push(value);
      index += 1;
      continue;
    }

    if (token.startsWith("--disable-pack=")) {
      const value = token.slice("--disable-pack=".length).trim();
      if (!value) {
        throw new Error("Option '--disable-pack=' requires a value.");
      }
      disablePacks.push(value);
      continue;
    }

    if (token === "--target") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--target' requires a value: jetbrains|cursor|all.");
      }
      target = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--target=")) {
      const value = token.slice("--target=".length).trim();
      if (!value) {
        throw new Error("Option '--target=' requires a value: jetbrains|cursor|all.");
      }
      target = value;
      continue;
    }

    if (token === "--project-root") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--project-root' requires a filesystem path.");
      }
      projectRoot = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--project-root=")) {
      const value = token.slice("--project-root=".length).trim();
      if (!value) {
        throw new Error("Option '--project-root=' requires a filesystem path.");
      }
      projectRoot = value;
      continue;
    }

    throw new Error(
      `Unknown option '${token}'. Supported options: --target <id|all>, --project-root <path>, --check, --apply, --guided, --confirm-detection, --sync, --confirm-sync, --enable-pack <id>, --disable-pack <id>.`
    );
  }

  return {
    target,
    projectRoot,
    check,
    apply,
    guided,
    confirmDetection,
    sync,
    confirmSync,
    enablePacks,
    disablePacks
  };
}

function resolveTargets(manifest: DocsManifest, targetOption: string): GeneratorTarget[] {
  if (targetOption === "all") {
    return manifest.generators.targets;
  }

  const selected = manifest.generators.targets.find((target) => target.id === targetOption);
  if (!selected) {
    const available = manifest.generators.targets.map((target) => target.id).join(", ");
    throw new Error(`Unknown target '${targetOption}'. Available targets: ${available}, all.`);
  }

  return [selected];
}

async function collectFileSnapshot(baseDir: string): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();

  async function walk(currentAbsoluteDir: string, currentRelativeDir: string): Promise<void> {
    const entries = await readdir(currentAbsoluteDir, { withFileTypes: true });
    entries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of entries) {
      const absolutePath = path.join(currentAbsoluteDir, entry.name);
      const relativePath = currentRelativeDir
        ? `${currentRelativeDir}/${entry.name}`
        : entry.name;

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const content = await readFile(absolutePath, "utf8");
      snapshot.set(relativePath, content);
    }
  }

  await walk(baseDir, "");
  return snapshot;
}

function getTargetRuntimeSourceDir(target: GeneratorTarget): string {
  const adapterDir = path.dirname(target.adapter_root);
  return path.join(KIT_ROOT, adapterDir, "runtime", target.runtime_dir);
}

function getTargetRuntimeDestinationDir(target: GeneratorTarget, projectRoot: string): string {
  return path.join(projectRoot, target.runtime_dir);
}

async function buildSyncPlan(target: GeneratorTarget, projectRoot: string): Promise<SyncPlan> {
  const sourceDir = getTargetRuntimeSourceDir(target);
  const destinationDir = getTargetRuntimeDestinationDir(target, projectRoot);

  const sourceFiles = await collectFileSnapshot(sourceDir);
  const operations: SyncOperation[] = [];
  let unchangedCount = 0;

  for (const [relPath, sourceContent] of sourceFiles.entries()) {
    const destinationPath = path.join(destinationDir, ...relPath.split("/"));
    let destinationContent = "";
    let exists = true;

    try {
      destinationContent = await readFile(destinationPath, "utf8");
    } catch {
      exists = false;
    }

    if (!exists) {
      operations.push({
        kind: "create",
        relPath,
        destPath: destinationPath,
        content: sourceContent
      });
      continue;
    }

    if (normalizeText(destinationContent) !== normalizeText(sourceContent)) {
      operations.push({
        kind: "update",
        relPath,
        destPath: destinationPath,
        content: sourceContent
      });
      continue;
    }

    unchangedCount += 1;
  }

  return {
    target,
    sourceDir,
    destinationDir,
    operations,
    unchangedCount
  };
}

function printSyncPlan(plan: SyncPlan, projectRoot: string): void {
  console.log(
    `docs-build: sync target=${plan.target.id} source='${path.relative(KIT_ROOT, plan.sourceDir)}' destination='${path.relative(projectRoot, plan.destinationDir)}'`
  );

  if (plan.operations.length === 0) {
    console.log(`docs-build: target=${plan.target.id} is up to date (unchanged=${plan.unchangedCount}).`);
    return;
  }

  for (const operation of plan.operations) {
    console.log(` - ${operation.kind.toUpperCase()}: ${operation.relPath}`);
  }

  console.log(
    `docs-build: target=${plan.target.id} pending changes=${plan.operations.length} (unchanged=${plan.unchangedCount}).`
  );
}

async function applySyncPlans(plans: SyncPlan[]): Promise<number> {
  let applied = 0;

  for (const plan of plans) {
    for (const operation of plan.operations) {
      await mkdir(path.dirname(operation.destPath), { recursive: true });
      await writeFile(operation.destPath, normalizeText(operation.content), "utf8");
      applied += 1;
    }
  }

  return applied;
}

async function readStackDetectionSpec(): Promise<StackDetectionSpec> {
  const fallback: StackDetectionSpec = {
    version: 1,
    mode: "dry-run",
    thresholds: {
      auto: 0.85,
      confirm: 0.6
    },
    candidates: [
      {
        id: "node-typescript",
        title: "Node.js + TypeScript",
        file_markers: [
          {
            path: "package.json",
            weight: 0.5,
            evidence: "Обнаружен package.json."
          },
          {
            path: "tsconfig.json",
            weight: 0.3,
            evidence: "Обнаружен tsconfig.json."
          }
        ],
        package_markers: [
          {
            dependency: "typescript",
            scope: "any",
            weight: 0.2,
            evidence: "Обнаружена зависимость typescript."
          }
        ]
      }
    ],
    last_result: {
      selected_stack: "unknown",
      confidence: 0,
      decision: "unknown",
      evidence: [],
      recommendation: "manual-selection-required"
    }
  };

  const spec = await readYamlFileOrDefault<StackDetectionSpec>(PROJECT_STACK_DETECTION_PATH, fallback);

  if (spec.candidates.length === 0) {
    throw new Error("Stack detection spec must include at least one candidate.");
  }

  return spec;
}

async function readEnabledPacksSpec(): Promise<EnabledPacksSpec> {
  const fallback: EnabledPacksSpec = {
    version: 1,
    default_target: "all",
    packs: [
      { id: "core", type: "section", enabled: true },
      { id: "stacks", type: "section", enabled: true },
      { id: "workflows", type: "section", enabled: true },
      { id: "roles", type: "section", enabled: true },
      { id: "adapters", type: "section", enabled: true },
      { id: "adapters.jetbrains", type: "target", enabled: true },
      { id: "adapters.cursor", type: "target", enabled: true }
    ]
  };

  return readYamlFileOrDefault<EnabledPacksSpec>(PROJECT_ENABLED_PACKS_PATH, fallback);
}

async function readPackageJsonMaybe(projectRoot: string): Promise<Record<string, unknown> | null> {
  const packageJsonPath = path.join(projectRoot, "package.json");
  if (!(await pathExists(packageJsonPath))) {
    return null;
  }

  const raw = await readFile(packageJsonPath, "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

function getDependencyMap(
  packageJson: Record<string, unknown>,
  key: "dependencies" | "devDependencies"
): Record<string, string> {
  const value = packageJson[key];
  if (!value || typeof value !== "object") {
    return {};
  }
  return value as Record<string, string>;
}

function hasPackageDependency(
  packageJson: Record<string, unknown> | null,
  dependency: string,
  scope: MarkerScope
): boolean {
  if (!packageJson) {
    return false;
  }

  const dependencies = getDependencyMap(packageJson, "dependencies");
  const devDependencies = getDependencyMap(packageJson, "devDependencies");

  if (scope === "dependencies") {
    return dependency in dependencies;
  }

  if (scope === "devDependencies") {
    return dependency in devDependencies;
  }

  return dependency in dependencies || dependency in devDependencies;
}

function toDecision(confidence: number, thresholds: StackDetectionSpec["thresholds"]): DetectionDecision {
  if (confidence >= thresholds.auto) {
    return "auto";
  }
  if (confidence >= thresholds.confirm) {
    return "confirm";
  }
  return "unknown";
}

function toRecommendation(decision: DetectionDecision): string {
  if (decision === "auto") {
    return "auto-apply-allowed";
  }
  if (decision === "confirm") {
    return "explicit-confirm-required";
  }
  return "manual-selection-required";
}

async function detectStack(spec: StackDetectionSpec, projectRoot: string): Promise<StackDetectionOutcome> {
  const packageJson = await readPackageJsonMaybe(projectRoot);
  const ranked: RankedCandidate[] = [];
  const matchedFiles = new Set<string>();

  for (const candidate of spec.candidates) {
    let score = 0;
    const evidence: string[] = [];

    for (const marker of candidate.file_markers ?? []) {
      const markerPath = path.join(projectRoot, marker.path);
      if (await pathExists(markerPath)) {
        score += marker.weight;
        evidence.push(marker.evidence);
        matchedFiles.add(marker.path);
      }
    }

    for (const marker of candidate.package_markers ?? []) {
      const scope = marker.scope ?? "any";
      if (hasPackageDependency(packageJson, marker.dependency, scope)) {
        score += marker.weight;
        evidence.push(marker.evidence);
      }
    }

    ranked.push({
      id: candidate.id,
      title: candidate.title,
      confidence: clampConfidence(score),
      evidence
    });
  }

  ranked.sort((left, right) => {
    if (right.confidence !== left.confidence) {
      return right.confidence - left.confidence;
    }
    return left.id.localeCompare(right.id);
  });

  const leader = ranked[0];
  const confidence = leader ? leader.confidence : 0;
  const decision = toDecision(confidence, spec.thresholds);

  return {
    selectedStack: decision === "unknown" ? "unknown" : leader.id,
    confidence,
    decision,
    evidence: leader ? leader.evidence : [],
    recommendation: toRecommendation(decision),
    ranked,
    matchedFiles: [...matchedFiles].sort((left, right) => left.localeCompare(right))
  };
}

function resolveEnabledPacks(
  spec: EnabledPacksSpec,
  enablePacks: string[],
  disablePacks: string[]
): EnabledPackEntry[] {
  const resolved = spec.packs.map((pack) => ({ ...pack }));
  const indexById = new Map<string, number>();

  for (let index = 0; index < resolved.length; index++) {
    indexById.set(resolved[index].id, index);
  }

  for (const packId of enablePacks) {
    const index = indexById.get(packId);
    if (index === undefined) {
      throw new Error(`Unknown pack id '${packId}' in --enable-pack.`);
    }
    resolved[index].enabled = true;
  }

  for (const packId of disablePacks) {
    const index = indexById.get(packId);
    if (index === undefined) {
      throw new Error(`Unknown pack id '${packId}' in --disable-pack.`);
    }
    resolved[index].enabled = false;
  }

  return resolved;
}

function inferPackageManagers(files: string[]): string[] {
  const managers: string[] = [];

  if (files.includes("pnpm-lock.yaml")) {
    managers.push("pnpm");
  }
  if (files.includes("yarn.lock")) {
    managers.push("yarn");
  }
  if (files.includes("package-lock.json")) {
    managers.push("npm");
  }
  if (files.includes("poetry.lock")) {
    managers.push("poetry");
  }
  if (files.includes("go.mod")) {
    managers.push("go-mod");
  }
  if (files.includes("Cargo.toml")) {
    managers.push("cargo");
  }

  return managers;
}

function inferLanguages(stackId: string): string[] {
  if (stackId === "node-typescript") {
    return ["typescript", "javascript"];
  }
  if (stackId === "python") {
    return ["python"];
  }
  if (stackId === "go") {
    return ["go"];
  }
  if (stackId === "rust") {
    return ["rust"];
  }
  return [];
}

function resolveCommentingProfile(stackId: string): string {
  if (stackId === "node-typescript") {
    return "node-typescript.tsdoc-v1";
  }
  if (stackId === "php" || stackId === "laravel" || stackId === "symfony") {
    return "php.phpdoc-v1";
  }
  if (stackId === "dart" || stackId === "flutter") {
    return "dart.dartdoc-v1";
  }
  return "generic.commenting-v1";
}

function buildProjectContext(outcome: StackDetectionOutcome, projectRoot: string): ProjectContextSpec {
  void projectRoot;
  const projectRootValue = ".";
  const projectId = outcome.selectedStack === "unknown" ? "manual-profile" : outcome.selectedStack;
  const activeCommentingProfile = resolveCommentingProfile(outcome.selectedStack);

  return {
    version: 1,
    status: "active",
    project: {
      id: projectId,
      root: projectRootValue,
      docs_installed: true,
      root_agents: {
        mode: "merge",
        overwrite: false
      }
    },
    facts: {
      files_present: outcome.matchedFiles,
      package_managers: inferPackageManagers(outcome.matchedFiles),
      languages: inferLanguages(outcome.selectedStack),
      runtimes: {
        jetbrains: ".aiassistant",
        cursor: ".cursor"
      }
    },
    detection: {
      selected_stack: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision,
      evidence: outcome.evidence
    },
    governance: {
      active_commenting_profile: activeCommentingProfile,
      commenting_profiles_ref: COMMENTING_PROFILES_REF
    },
    notes: [
      "Root AGENTS.md должен применяться только через merge-предложение.",
      "Dry-run является режимом по умолчанию."
    ]
  };
}

function buildProfileLock(
  outcome: StackDetectionOutcome,
  packs: EnabledPackEntry[],
  targets: GeneratorTarget[],
  confirmDetection: boolean
): ProfileLockSpec {
  const activeCommentingProfile = resolveCommentingProfile(outcome.selectedStack);

  return {
    version: 1,
    locked: true,
    profile_id: outcome.selectedStack === "unknown" ? "manual-profile" : outcome.selectedStack,
    detected_stack: {
      id: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision
    },
    enabled_packs: packs.filter((pack) => pack.enabled).map((pack) => pack.id),
    overrides_ref: "aagf/docs/spec/project/overrides.yaml",
    generated_targets: targets.map((target) => target.id),
    root_agents: {
      mode: "merge",
      overwrite: false,
      confirmed: confirmDetection
    },
    governance: {
      active_commenting_profile: activeCommentingProfile,
      commenting_profiles_ref: COMMENTING_PROFILES_REF
    }
  };
}

function printDetectionOutcome(outcome: StackDetectionOutcome): void {
  console.log(
    `docs-build: detect-stack selected='${outcome.selectedStack}' confidence=${outcome.confidence.toFixed(2)} decision=${outcome.decision}`
  );

  if (outcome.evidence.length > 0) {
    console.log("docs-build: evidence:");
    for (const item of outcome.evidence) {
      console.log(` - ${item}`);
    }
  }

  console.log(`docs-build: recommendation='${outcome.recommendation}'.`);
}

function withDetectionResult(
  spec: StackDetectionSpec,
  outcome: StackDetectionOutcome,
  mode: "dry-run" | "apply"
): StackDetectionSpec {
  return {
    ...spec,
    mode,
    last_result: {
      selected_stack: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision,
      evidence: outcome.evidence,
      recommendation: outcome.recommendation
    }
  };
}

async function runDetectStackCommand(cliOptions: CliOptions): Promise<void> {
  if (cliOptions.check) {
    throw new Error("Option '--check' is not supported with command 'detect-stack'.");
  }

  const projectRoot = resolveProjectRoot(cliOptions.projectRoot);
  const spec = await readStackDetectionSpec();
  const outcome = await detectStack(spec, projectRoot);
  printDetectionOutcome(outcome);
  console.log(
    `docs-build: project-root='${projectRoot}', root AGENTS.md strategy=merge-only (overwrite disabled).`
  );

  if (!cliOptions.apply) {
    console.log("docs-build: detect-stack finished in dry-run mode. No files were changed.");
    return;
  }

  const updatedSpec = withDetectionResult(spec, outcome, "apply");
  const context = buildProjectContext(outcome, projectRoot);

  await writeYamlFile(PROJECT_STACK_DETECTION_PATH, updatedSpec);
  await writeYamlFile(PROJECT_CONTEXT_PATH, context);

  console.log(
    `docs-build: detect-stack applied updates to '${path.relative(KIT_ROOT, PROJECT_STACK_DETECTION_PATH)}' and '${path.relative(KIT_ROOT, PROJECT_CONTEXT_PATH)}'.`
  );
}

async function runBootstrapCommand(
  manifest: DocsManifest,
  sections: EnrichedSection[],
  cliOptions: CliOptions
): Promise<void> {
  if (cliOptions.check) {
    throw new Error("Option '--check' is not supported with command 'bootstrap'.");
  }

  const dryRun = !cliOptions.apply;
  const modeLabel = dryRun ? "dry-run" : "apply";
  const projectRoot = resolveProjectRoot(cliOptions.projectRoot);
  const targets = resolveTargets(manifest, cliOptions.target);

  console.log(
    `docs-build: bootstrap mode=${modeLabel} target=${cliOptions.target} guided=${cliOptions.guided ? "true" : "false"} project-root='${projectRoot}'.`
  );

  const docsExists = await pathExists(path.join(KIT_ROOT, "docs"));
  const rootAgentsExists = await pathExists(path.join(projectRoot, "AGENTS.md"));

  if (!docsExists) {
    throw new Error("Bootstrap Install phase failed: 'aagf/docs/' was not found in kit root.");
  }

  console.log(
    `phase Install: aagf/docs/=ok, root AGENTS.md=${rootAgentsExists ? "found" : "missing"}, strategy=merge-only, overwrite=disabled.`
  );

  const stackSpec = await readStackDetectionSpec();
  const detection = await detectStack(stackSpec, projectRoot);
  console.log("phase Detect:");
  printDetectionOutcome(detection);

  const confirmRequired = detection.decision !== "auto";
  if (confirmRequired && !cliOptions.confirmDetection) {
    console.log(
      `phase Confirm: confirmation required for decision='${detection.decision}'. Re-run with --confirm-detection to continue.`
    );
    console.log("docs-build: bootstrap stopped at Confirm gate.");
    return;
  }

  console.log("phase Confirm: passed.");

  const packsSpec = await readEnabledPacksSpec();
  const resolvedPacks = resolveEnabledPacks(packsSpec, cliOptions.enablePacks, cliOptions.disablePacks);
  const enabledPackIds = resolvedPacks.filter((pack) => pack.enabled).map((pack) => pack.id);

  console.log(
    `phase Compose: enabled packs=${enabledPackIds.length}, overrides file='${path.relative(KIT_ROOT, PROJECT_OVERRIDES_PATH)}'.`
  );

  const outputs = renderOutputs(manifest, sections, targets);

  if (dryRun) {
    console.log(`phase Generate: dry-run -> would generate ${outputs.size} files from docs/spec/**.`);
  } else {
    await writeOutputs(outputs);
    console.log(`phase Generate: generated ${outputs.size} files from docs/spec/**.`);
  }

  if (cliOptions.sync) {
    const plans = await Promise.all(targets.map((target) => buildSyncPlan(target, projectRoot)));
    const pendingChanges = plans.reduce((acc, plan) => acc + plan.operations.length, 0);

    console.log("phase Sync:");
    for (const plan of plans) {
      printSyncPlan(plan, projectRoot);
    }

    if (!cliOptions.confirmSync) {
      console.log("phase Sync: explicit confirmation is required. Re-run with --confirm-sync to apply.");
    } else if (dryRun) {
      console.log(`phase Sync: dry-run confirmed, pending changes=${pendingChanges}.`);
    } else if (pendingChanges === 0) {
      console.log("phase Sync: no changes to apply.");
    } else {
      const applied = await applySyncPlans(plans);
      console.log(`phase Sync: applied ${applied} runtime changes.`);
    }
  } else {
    console.log("phase Sync: skipped (use --sync to enable).");
  }

  const context = buildProjectContext(detection, projectRoot);
  const lock = buildProfileLock(detection, resolvedPacks, targets, cliOptions.confirmDetection);
  const updatedDetectionSpec = withDetectionResult(stackSpec, detection, dryRun ? "dry-run" : "apply");

  if (dryRun) {
    console.log(
      `phase Lock: dry-run -> would update '${path.relative(KIT_ROOT, PROJECT_CONTEXT_PATH)}', '${path.relative(KIT_ROOT, PROJECT_STACK_DETECTION_PATH)}', '${path.relative(KIT_ROOT, PROJECT_PROFILE_LOCK_PATH)}'.`
    );
    return;
  }

  await writeYamlFile(PROJECT_CONTEXT_PATH, context);
  await writeYamlFile(PROJECT_STACK_DETECTION_PATH, updatedDetectionSpec);
  await writeYamlFile(PROJECT_PROFILE_LOCK_PATH, lock);

  console.log(
    `phase Lock: updated '${path.relative(KIT_ROOT, PROJECT_PROFILE_LOCK_PATH)}' with profile='${lock.profile_id}'.`
  );
}

function assertNoBootstrapOnlyOptions(command: string, options: CliOptions): void {
  const usedBootstrapOption =
    options.guided ||
    options.confirmDetection ||
    options.sync ||
    options.confirmSync ||
    options.enablePacks.length > 0 ||
    options.disablePacks.length > 0;

  if (usedBootstrapOption) {
    throw new Error(
      `Options --guided, --confirm-detection, --sync, --confirm-sync, --enable-pack, --disable-pack are supported only with 'bootstrap'. Command='${command}'.`
    );
  }
}

function assertNoApplyOption(command: string, options: CliOptions): void {
  if (options.apply) {
    throw new Error(`Option '--apply' is not supported with command '${command}'.`);
  }
}

async function main(): Promise<void> {
  const command = process.argv[2];
  const cliOptions = parseCliOptions(process.argv.slice(3));

  if (!command) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (command === "detect-stack") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    await runDetectStackCommand(cliOptions);
    return;
  }

  const manifest = await readManifest();
  const sections = await loadSections(manifest);

  if (command === "bootstrap") {
    await runBootstrapCommand(manifest, sections, cliOptions);
    return;
  }

  if (command === "validate") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    assertNoApplyOption(command, cliOptions);

    if (cliOptions.check) {
      throw new Error("Option '--check' is supported only with the 'sync' command.");
    }

    const context = buildTemplateContext(manifest, sections);
    console.log(
      `docs-build: validated manifest + sections (sections=${context.stats.sections}, entries=${context.stats.entries}, rules=${context.stats.rules}).`
    );
    return;
  }

  const targets = resolveTargets(manifest, cliOptions.target);
  const outputs = renderOutputs(manifest, sections, targets);

  if (command === "sync") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    assertNoApplyOption(command, cliOptions);

    const projectRoot = resolveProjectRoot(cliOptions.projectRoot);
    const plans = await Promise.all(targets.map((target) => buildSyncPlan(target, projectRoot)));
    const pendingChanges = plans.reduce((acc, plan) => acc + plan.operations.length, 0);

    for (const plan of plans) {
      printSyncPlan(plan, projectRoot);
    }

    if (cliOptions.check) {
      if (pendingChanges > 0) {
        process.exitCode = 1;
      }
      return;
    }

    if (pendingChanges === 0) {
      console.log(`docs-build: sync completed, nothing to apply (target=${cliOptions.target}).`);
      return;
    }

    const applied = await applySyncPlans(plans);
    console.log(`docs-build: sync applied ${applied} changes (target=${cliOptions.target}).`);
    return;
  }

  if (command === "generate") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    assertNoApplyOption(command, cliOptions);

    if (cliOptions.check) {
      throw new Error("Option '--check' is supported only with the 'sync' command.");
    }

    await writeOutputs(outputs);
    console.log(`docs-build: generated ${outputs.size} files (target=${cliOptions.target}).`);
    return;
  }

  if (command === "check") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    assertNoApplyOption(command, cliOptions);

    if (cliOptions.check) {
      throw new Error("Option '--check' is supported only with the 'sync' command.");
    }

    const drifted = await checkDrift(outputs);

    if (drifted.length > 0) {
      console.error("docs-build: drift detected in generated files:");
      for (const filePath of drifted) {
        console.error(` - ${filePath}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`docs-build: no drift detected (target=${cliOptions.target}).`);
    return;
  }

  if (command === "test") {
    assertNoBootstrapOnlyOptions(command, cliOptions);
    assertNoApplyOption(command, cliOptions);

    if (cliOptions.check) {
      throw new Error("Option '--check' is supported only with the 'sync' command.");
    }

    await writeOutputs(outputs);
    const drifted = await checkDrift(outputs);

    if (drifted.length > 0) {
      console.error("docs-build: test failed, drift detected after generation:");
      for (const filePath of drifted) {
        console.error(` - ${filePath}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log(`docs-build: test passed (target=${cliOptions.target}, files=${outputs.size}).`);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`docs-build: ${message}`);
  process.exitCode = 1;
});
