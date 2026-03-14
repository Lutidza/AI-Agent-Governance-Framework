import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
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
  detectionAction: "confirm" | "edit" | null;
  detectSelectedStack: string;
  detectEditPayloads: string[];
  detectNotes: string[];
};

type DetectionDecision = "auto" | "confirm" | "unknown";

type DetectionSessionStatus = "pending-confirm" | "confirmed" | "edited";

type StackLevelKey =
  | "os"
  | "server"
  | "runtime"
  | "languages"
  | "frameworks"
  | "libraries"
  | "packages"
  | "databases"
  | "cache"
  | "messaging"
  | "ci"
  | "deploy";

type StackLevelItem = {
  id: string;
  version: string;
  confidence: number;
  source: "mcp" | "user";
  evidence: string[];
};

type MarkerScope = "dependencies" | "devDependencies" | "any";

type StackContextSpec = {
  version: number;
  source: "mcp";
  session_id: string;
  detected_at: string;
  levels: Record<StackLevelKey, StackLevelItem[]>;
  summary: {
    primary_stack_id: string;
    confidence: number;
    decision: DetectionDecision;
    unknown_levels: StackLevelKey[];
  };
};

type StackOverrideEdit = {
  level: StackLevelKey;
  action: "add" | "replace";
  item: StackLevelItem;
};

type StackOverridesSpec = {
  version: number;
  selected_stack_override?: string;
  edits: StackOverrideEdit[];
  notes?: string[];
};

type StackDetectionSpec = {
  version: number;
  mode?: "dry-run" | "apply";
  detector: {
    provider: "mcp";
    tool: string;
    protocol: string;
    notify_dialog: boolean;
  };
  thresholds: {
    auto: number;
    confirm: number;
  };
  levels_required: StackLevelKey[];
  last_session?: {
    session_id: string;
    status: DetectionSessionStatus;
    started_at: string;
    finished_at: string;
    result: {
      selected_stack: string;
      confidence: number;
      decision: DetectionDecision;
      evidence: string[];
      recommendation: string;
      source: "mcp";
      stack_context_ref: string;
      overrides_applied: boolean;
    };
  };
};

type DetectionSessionRecord = NonNullable<StackDetectionSpec["last_session"]>;

type McpDetectStackDeepRequest = {
  version: number;
  protocol: string;
  tool: string;
  session_id: string;
  project_root: string;
  thresholds: StackDetectionSpec["thresholds"];
  levels_required: StackLevelKey[];
};

type McpDetectStackDeepResponse = {
  version: number;
  protocol: string;
  tool: string;
  session_id: string;
  source: "mcp";
  started_at: string;
  finished_at: string;
  selected_stack: string;
  confidence: number;
  decision: DetectionDecision;
  evidence: string[];
  recommendation: string;
  stack_context: StackContextSpec;
  matched_files: string[];
  ranked: RankedCandidate[];
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
  source: "mcp";
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  status: DetectionSessionStatus;
  stackContext: StackContextSpec;
  unknownLevels: StackLevelKey[];
  overridesApplied: boolean;
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
    source: "mcp";
    session_id: string;
    status: DetectionSessionStatus;
    stack_context_ref: string;
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
    source: "mcp";
    session_id: string;
    status: DetectionSessionStatus;
    stack_context_ref: string;
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

type RootAgentsInstallPlan = {
  templateRelPath: string;
  templateAbsolutePath: string;
  templateContent: string;
  destinationPath: string;
  destinationExists: boolean;
  needsWrite: boolean;
};

const KIT_ROOT = process.cwd();
const MANIFEST_PATH = path.join(KIT_ROOT, "docs/spec/manifests/docs.manifest.yaml");
const MANIFEST_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/docs-manifest.schema.json");
const SECTION_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/section-spec.schema.json");
const RULE_MODULE_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/rule-module.schema.json");
const RULES_INDEX_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/rules-index.schema.json");
const STACK_CONTEXT_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/stack-context.schema.json");
const STACK_OVERRIDES_SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/stack-overrides.schema.json");
const TEMPLATE_DIR = path.join(KIT_ROOT, "tools/templates");
const PROJECT_SPEC_DIR = path.join(KIT_ROOT, "docs/spec/project");
const PROJECT_CONTEXT_PATH = path.join(PROJECT_SPEC_DIR, "context.yaml");
const PROJECT_STACK_DETECTION_PATH = path.join(PROJECT_SPEC_DIR, "stack-detection.yaml");
const PROJECT_STACK_CONTEXT_PATH = path.join(PROJECT_SPEC_DIR, "stack-context.yaml");
const PROJECT_STACK_OVERRIDES_PATH = path.join(PROJECT_SPEC_DIR, "stack-overrides.yaml");
const PROJECT_ENABLED_PACKS_PATH = path.join(PROJECT_SPEC_DIR, "enabled-packs.yaml");
const PROJECT_OVERRIDES_PATH = path.join(PROJECT_SPEC_DIR, "overrides.yaml");
const PROJECT_PROFILE_LOCK_PATH = path.join(PROJECT_SPEC_DIR, "profile.lock.yaml");
const MCP_DETECT_STACK_TOOL_PATH = path.join(KIT_ROOT, "tools/src/mcp/detect-stack-deep.ts");
const COMMENTING_PROFILES_REF = "aagf/docs/spec/stacks/comment-doc-profiles.yaml";
const ROOT_AGENTS_TEMPLATE_REL = "docs/install/AGENTS.md";
const STACK_CONTEXT_REF = "aagf/docs/spec/project/stack-context.yaml";

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

async function buildRootAgentsInstallPlan(projectRoot: string): Promise<RootAgentsInstallPlan> {
  const templateAbsolutePath = path.join(KIT_ROOT, ROOT_AGENTS_TEMPLATE_REL);
  if (!(await pathExists(templateAbsolutePath))) {
    throw new Error(
      `Bootstrap Install phase failed: root AGENTS template '${ROOT_AGENTS_TEMPLATE_REL}' was not found.`
    );
  }

  const templateContent = normalizeText(await readFile(templateAbsolutePath, "utf8"));
  const destinationPath = path.join(projectRoot, "AGENTS.md");
  let destinationExists = true;
  let destinationContent = "";

  try {
    destinationContent = await readFile(destinationPath, "utf8");
  } catch {
    destinationExists = false;
  }

  const needsWrite =
    !destinationExists || normalizeText(destinationContent) !== templateContent;

  return {
    templateRelPath: ROOT_AGENTS_TEMPLATE_REL,
    templateAbsolutePath,
    templateContent,
    destinationPath,
    destinationExists,
    needsWrite
  };
}

async function applyRootAgentsInstallPlan(plan: RootAgentsInstallPlan): Promise<void> {
  await mkdir(path.dirname(plan.destinationPath), { recursive: true });
  await writeFile(plan.destinationPath, plan.templateContent, "utf8");
}

function printUsage(): void {
  console.log(
    "Usage: tsx tools/src/cli.ts <validate|generate|check|test|sync|detect-stack|bootstrap> [--target <jetbrains|cursor|all>] [--project-root <path>] [--check] [--apply] [--guided] [--confirm-detection] [--sync] [--confirm-sync] [--enable-pack <id>] [--disable-pack <id>] [--detect-action <confirm|edit>] [--detect-selected-stack <id>] [--detect-edit <json|yaml>] [--detect-note <text>]"
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
  let detectionAction: "confirm" | "edit" | null = null;
  let detectSelectedStack = "";
  const detectEditPayloads: string[] = [];
  const detectNotes: string[] = [];

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

    if (token === "--detect-action") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--detect-action' requires a value: confirm|edit.");
      }
      if (value !== "confirm" && value !== "edit") {
        throw new Error("Option '--detect-action' supports only values: confirm|edit.");
      }
      detectionAction = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--detect-action=")) {
      const value = token.slice("--detect-action=".length).trim();
      if (!value) {
        throw new Error("Option '--detect-action=' requires a value: confirm|edit.");
      }
      if (value !== "confirm" && value !== "edit") {
        throw new Error("Option '--detect-action=' supports only values: confirm|edit.");
      }
      detectionAction = value;
      continue;
    }

    if (token === "--detect-selected-stack") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--detect-selected-stack' requires a value.");
      }
      detectSelectedStack = value;
      index += 1;
      continue;
    }

    if (token.startsWith("--detect-selected-stack=")) {
      const value = token.slice("--detect-selected-stack=".length).trim();
      if (!value) {
        throw new Error("Option '--detect-selected-stack=' requires a value.");
      }
      detectSelectedStack = value;
      continue;
    }

    if (token === "--detect-edit") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--detect-edit' requires a JSON/YAML payload value.");
      }
      detectEditPayloads.push(value);
      index += 1;
      continue;
    }

    if (token.startsWith("--detect-edit=")) {
      const value = token.slice("--detect-edit=".length).trim();
      if (!value) {
        throw new Error("Option '--detect-edit=' requires a JSON/YAML payload value.");
      }
      detectEditPayloads.push(value);
      continue;
    }

    if (token === "--detect-note") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Option '--detect-note' requires a value.");
      }
      detectNotes.push(value);
      index += 1;
      continue;
    }

    if (token.startsWith("--detect-note=")) {
      const value = token.slice("--detect-note=".length).trim();
      if (!value) {
        throw new Error("Option '--detect-note=' requires a value.");
      }
      detectNotes.push(value);
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
      `Unknown option '${token}'. Supported options: --target <id|all>, --project-root <path>, --check, --apply, --guided, --confirm-detection, --sync, --confirm-sync, --enable-pack <id>, --disable-pack <id>, --detect-action <confirm|edit>, --detect-selected-stack <id>, --detect-edit <json|yaml>, --detect-note <text>.`
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
    disablePacks,
    detectionAction,
    detectSelectedStack,
    detectEditPayloads,
    detectNotes
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
    version: 2,
    mode: "dry-run",
    detector: {
      provider: "mcp",
      tool: "aagf.detect_stack_deep",
      protocol: "aagf.mcp.v1",
      notify_dialog: true
    },
    thresholds: {
      auto: 0.85,
      confirm: 0.6
    },
    levels_required: [
      "os",
      "server",
      "runtime",
      "languages",
      "frameworks",
      "libraries",
      "packages",
      "databases",
      "cache",
      "messaging",
      "ci",
      "deploy"
    ],
    last_session: {
      session_id: "none",
      status: "pending-confirm",
      started_at: "1970-01-01T00:00:00.000Z",
      finished_at: "1970-01-01T00:00:00.000Z",
      result: {
        selected_stack: "unknown",
        confidence: 0,
        decision: "unknown",
        evidence: [],
        recommendation: "manual-selection-required",
        source: "mcp",
        stack_context_ref: STACK_CONTEXT_REF,
        overrides_applied: false
      }
    }
  };

  const spec = await readYamlFileOrDefault<StackDetectionSpec>(PROJECT_STACK_DETECTION_PATH, fallback);

  if (spec.detector.provider !== "mcp") {
    throw new Error("Stack detection is MCP-only: detector.provider MUST be 'mcp'.");
  }

  if (!spec.detector.tool.trim()) {
    throw new Error("Stack detection spec must declare non-empty detector.tool.");
  }

  if (!spec.detector.protocol.trim()) {
    throw new Error("Stack detection spec must declare non-empty detector.protocol.");
  }

  if (spec.thresholds.auto < 0 || spec.thresholds.auto > 1) {
    throw new Error("Stack detection spec threshold 'auto' MUST be in range [0..1].");
  }

  if (spec.thresholds.confirm < 0 || spec.thresholds.confirm > 1) {
    throw new Error("Stack detection spec threshold 'confirm' MUST be in range [0..1].");
  }

  if (spec.thresholds.confirm > spec.thresholds.auto) {
    throw new Error("Stack detection spec requires confirm <= auto.");
  }

  if (spec.levels_required.length === 0) {
    throw new Error("Stack detection spec must include at least one required stack level.");
  }

  const uniqueLevels = new Set<StackLevelKey>(spec.levels_required);
  if (uniqueLevels.size !== spec.levels_required.length) {
    throw new Error("Stack detection spec contains duplicated level IDs in levels_required.");
  }

  return spec;
}

async function readStackOverridesSpec(): Promise<StackOverridesSpec> {
  const fallback: StackOverridesSpec = {
    version: 1,
    edits: [],
    notes: [
      "Правки стека от специалиста фиксируются здесь после диалогового confirm/edit."
    ]
  };

  const spec = await readYamlFileOrDefault<StackOverridesSpec>(PROJECT_STACK_OVERRIDES_PATH, fallback);
  await validateAgainstSchema(STACK_OVERRIDES_SCHEMA_PATH, spec, PROJECT_STACK_OVERRIDES_PATH);
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

function uniqueStackItems(items: StackLevelItem[]): StackLevelItem[] {
  const seen = new Set<string>();
  const result: StackLevelItem[] = [];

  for (const item of items) {
    const key = `${item.id}:${item.version}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

function levelConfidence(items: StackLevelItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  return items.reduce((max, item) => Math.max(max, item.confidence), 0);
}

function guessPrimaryStackId(levels: Record<StackLevelKey, StackLevelItem[]>): string {
  const runtimeIds = new Set(levels.runtime.map((item) => item.id));
  const languageIds = new Set(levels.languages.map((item) => item.id));

  if (runtimeIds.has("node") && languageIds.has("typescript")) {
    return "node-typescript";
  }
  if (runtimeIds.has("node")) {
    return "node-javascript";
  }
  if (runtimeIds.has("python")) {
    return "python";
  }
  if (runtimeIds.has("go")) {
    return "go";
  }
  if (runtimeIds.has("rust")) {
    return "rust";
  }
  if (runtimeIds.has("php")) {
    return "php";
  }
  if (runtimeIds.has("dart")) {
    return "dart";
  }

  return "unknown";
}

function summarizeStackConfidence(
  levels: Record<StackLevelKey, StackLevelItem[]>,
  requiredLevels: StackLevelKey[]
): { confidence: number; unknownLevels: StackLevelKey[] } {
  const unknownLevels: StackLevelKey[] = [];
  let sum = 0;

  for (const level of requiredLevels) {
    const items = levels[level];
    const confidence = levelConfidence(items);
    sum += confidence;

    if (items.length === 0 || items.every((item) => item.id === "unknown")) {
      unknownLevels.push(level);
    }
  }

  const normalized = requiredLevels.length === 0 ? 0 : sum / requiredLevels.length;
  return {
    confidence: clampConfidence(normalized),
    unknownLevels
  };
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} MUST be an object.`);
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} MUST be a non-empty string.`);
  }
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new Error(`${label} MUST be a number.`);
  }
  return value;
}

function asStringArray(value: unknown, label: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} MUST be an array of strings.`);
  }
  return value.map((entry, index) => asString(entry, `${label}[${index}]`));
}

function asDecision(value: unknown, label: string): DetectionDecision {
  const normalized = asString(value, label);
  if (normalized === "auto" || normalized === "confirm" || normalized === "unknown") {
    return normalized;
  }
  throw new Error(`${label} MUST be one of: auto|confirm|unknown.`);
}

function asStackLevels(value: unknown, label: string): StackLevelKey[] {
  const levels = asStringArray(value, label);
  const normalized: StackLevelKey[] = [];

  for (let index = 0; index < levels.length; index++) {
    const level = levels[index];
    if (
      level !== "os" &&
      level !== "server" &&
      level !== "runtime" &&
      level !== "languages" &&
      level !== "frameworks" &&
      level !== "libraries" &&
      level !== "packages" &&
      level !== "databases" &&
      level !== "cache" &&
      level !== "messaging" &&
      level !== "ci" &&
      level !== "deploy"
    ) {
      throw new Error(`${label}[${index}] has unsupported stack level '${level}'.`);
    }
    normalized.push(level);
  }

  return normalized;
}

function parseStackOverrideEditFromCliPayload(
  rawPayload: string,
  index: number
): StackOverrideEdit {
  let parsedPayload: unknown;

  try {
    parsedPayload = JSON.parse(rawPayload) as unknown;
  } catch {
    try {
      parsedPayload = YAML.parse(rawPayload) as unknown;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`--detect-edit[${index}] contains invalid JSON/YAML payload: ${message}`);
    }
  }

  const payload = asRecord(parsedPayload, `--detect-edit[${index}]`);
  const level = asStackLevels(
    [asString(payload.level, `--detect-edit[${index}].level`)],
    `--detect-edit[${index}].level`
  )[0];
  const actionRaw = asString(payload.action, `--detect-edit[${index}].action`);

  if (actionRaw !== "add" && actionRaw !== "replace") {
    throw new Error(
      `--detect-edit[${index}].action supports only values: add|replace.`
    );
  }

  const itemPayload = asRecord(payload.item, `--detect-edit[${index}].item`);
  const evidenceInput = itemPayload.evidence === undefined
    ? [`Правка стека внесена через --detect-edit[${index}].`]
    : asStringArray(itemPayload.evidence, `--detect-edit[${index}].item.evidence`);

  if (evidenceInput.length === 0) {
    throw new Error(`--detect-edit[${index}].item.evidence MUST contain at least one item.`);
  }

  const versionInput = itemPayload.version === undefined
    ? ""
    : asString(itemPayload.version, `--detect-edit[${index}].item.version`);
  const confidenceInput = itemPayload.confidence === undefined
    ? 1
    : asNumber(itemPayload.confidence, `--detect-edit[${index}].item.confidence`);

  return {
    level,
    action: actionRaw,
    item: {
      id: asString(itemPayload.id, `--detect-edit[${index}].item.id`),
      version: versionInput,
      confidence: clampConfidence(confidenceInput),
      source: "user",
      evidence: evidenceInput
    }
  };
}

async function resolveDialogOverridesFromCliOptions(
  cliOptions: CliOptions
): Promise<{
  action: "confirm" | "edit" | null;
  overrides: StackOverridesSpec | null;
}> {
  const hasEditInput =
    cliOptions.detectEditPayloads.length > 0 ||
    cliOptions.detectSelectedStack.trim().length > 0 ||
    cliOptions.detectNotes.length > 0;
  let action = cliOptions.detectionAction;

  if (!action && hasEditInput) {
    action = "edit";
  }

  if (action === "confirm" && hasEditInput) {
    throw new Error(
      "Option '--detect-action confirm' conflicts with edit payloads. Remove --detect-edit/--detect-selected-stack/--detect-note or switch to '--detect-action edit'."
    );
  }

  if (action !== "edit") {
    return {
      action,
      overrides: null
    };
  }

  const selectedStack = cliOptions.detectSelectedStack.trim();
  const edits = cliOptions.detectEditPayloads.map((payload, index) =>
    parseStackOverrideEditFromCliPayload(payload, index)
  );
  if (!selectedStack && edits.length === 0) {
    throw new Error(
      "Detection action 'edit' requires either --detect-selected-stack or at least one --detect-edit payload."
    );
  }

  const overrides: StackOverridesSpec = {
    version: 1,
    edits
  };

  if (selectedStack) {
    overrides.selected_stack_override = selectedStack;
  }
  if (cliOptions.detectNotes.length > 0) {
    overrides.notes = cliOptions.detectNotes;
  }

  await validateAgainstSchema(STACK_OVERRIDES_SCHEMA_PATH, overrides, "cli.detect-overrides");

  return {
    action,
    overrides
  };
}

async function resolveDetectionDialogState(
  cliOptions: CliOptions,
  applyChanges: boolean,
  commandLabel: "detect-stack" | "bootstrap"
): Promise<{
  action: "confirm" | "edit" | null;
  overrides: StackOverridesSpec;
  hasEdits: boolean;
}> {
  const storedOverrides = await readStackOverridesSpec();
  const dialogOverrides = await resolveDialogOverridesFromCliOptions(cliOptions);
  let activeOverrides = storedOverrides;

  if (dialogOverrides.overrides) {
    activeOverrides = dialogOverrides.overrides;

    if (applyChanges) {
      await writeYamlFile(PROJECT_STACK_OVERRIDES_PATH, activeOverrides);
      console.log(
        `${commandLabel}: saved dialog edits to '${path.relative(KIT_ROOT, PROJECT_STACK_OVERRIDES_PATH)}'.`
      );
    } else {
      console.log(
        `${commandLabel}: dry-run -> would save dialog edits to '${path.relative(KIT_ROOT, PROJECT_STACK_OVERRIDES_PATH)}'.`
      );
    }
  }

  const hasEdits = hasStackOverrides(activeOverrides);
  if (dialogOverrides.action === "confirm" && hasEdits) {
    throw new Error(
      "Detection action 'confirm' conflicts with non-empty stack-overrides. Remove overrides or use edit."
    );
  }

  if (dialogOverrides.action === "edit" && !hasEdits) {
    throw new Error(
      "Detection action 'edit' requires non-empty overrides after merge."
    );
  }

  return {
    action: dialogOverrides.action,
    overrides: activeOverrides,
    hasEdits
  };
}

function parseMcpDetectStackDeepResponse(
  payload: unknown,
  expected: {
    protocol: string;
    tool: string;
    sessionId: string;
  }
): McpDetectStackDeepResponse {
  const raw = asRecord(payload, "mcp.response");
  const stackContextRaw = asRecord(raw.stack_context, "mcp.response.stack_context");
  const summaryRaw = asRecord(stackContextRaw.summary, "mcp.response.stack_context.summary");

  const response: McpDetectStackDeepResponse = {
    version: asNumber(raw.version, "mcp.response.version"),
    protocol: asString(raw.protocol, "mcp.response.protocol"),
    tool: asString(raw.tool, "mcp.response.tool"),
    session_id: asString(raw.session_id, "mcp.response.session_id"),
    source: asString(raw.source, "mcp.response.source") as "mcp",
    started_at: asString(raw.started_at, "mcp.response.started_at"),
    finished_at: asString(raw.finished_at, "mcp.response.finished_at"),
    selected_stack: asString(raw.selected_stack, "mcp.response.selected_stack"),
    confidence: clampConfidence(asNumber(raw.confidence, "mcp.response.confidence")),
    decision: asDecision(raw.decision, "mcp.response.decision"),
    evidence: asStringArray(raw.evidence, "mcp.response.evidence"),
    recommendation: asString(raw.recommendation, "mcp.response.recommendation"),
    stack_context: stackContextRaw as StackContextSpec,
    matched_files: asStringArray(raw.matched_files, "mcp.response.matched_files"),
    ranked: (() => {
      if (!Array.isArray(raw.ranked)) {
        throw new Error("mcp.response.ranked MUST be an array.");
      }

      return raw.ranked.map((item, index) => {
        const rankedRaw = asRecord(item, `mcp.response.ranked[${index}]`);
        return {
          id: asString(rankedRaw.id, `mcp.response.ranked[${index}].id`),
          title: asString(rankedRaw.title, `mcp.response.ranked[${index}].title`),
          confidence: clampConfidence(
            asNumber(rankedRaw.confidence, `mcp.response.ranked[${index}].confidence`)
          ),
          evidence: asStringArray(rankedRaw.evidence, `mcp.response.ranked[${index}].evidence`)
        };
      });
    })()
  };

  if (response.source !== "mcp") {
    throw new Error("mcp.response.source MUST be 'mcp'.");
  }

  if (response.protocol !== expected.protocol) {
    throw new Error(
      `MCP protocol mismatch: response='${response.protocol}', expected='${expected.protocol}'.`
    );
  }

  if (response.tool !== expected.tool) {
    throw new Error(`MCP tool mismatch: response='${response.tool}', expected='${expected.tool}'.`);
  }

  if (response.session_id !== expected.sessionId) {
    throw new Error(
      `MCP session mismatch: response='${response.session_id}', expected='${expected.sessionId}'.`
    );
  }

  const summaryDecision = asDecision(
    summaryRaw.decision,
    "mcp.response.stack_context.summary.decision"
  );
  if (summaryDecision !== response.decision) {
    throw new Error(
      `MCP decision mismatch: stack-context='${summaryDecision}', response='${response.decision}'.`
    );
  }

  const summaryConfidence = clampConfidence(
    asNumber(summaryRaw.confidence, "mcp.response.stack_context.summary.confidence")
  );
  if (summaryConfidence !== response.confidence) {
    throw new Error(
      `MCP confidence mismatch: stack-context=${summaryConfidence}, response=${response.confidence}.`
    );
  }

  return response;
}

async function invokeMcpDetectStackDeep(
  request: McpDetectStackDeepRequest
): Promise<McpDetectStackDeepResponse> {
  return await new Promise<McpDetectStackDeepResponse>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", MCP_DETECT_STACK_TOOL_PATH],
      {
        cwd: KIT_ROOT,
        stdio: ["pipe", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";
    let settled = false;

    const fail = (error: Error): void => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    const succeed = (response: McpDetectStackDeepResponse): void => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(response);
    };

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error: Error) => {
      fail(
        new Error(
          `MCP transport failed to start tool '${request.tool}' via '${MCP_DETECT_STACK_TOOL_PATH}': ${error.message}`
        )
      );
    });

    child.stdin.on("error", (error: Error) => {
      fail(
        new Error(
          `MCP transport stdin failure for tool '${request.tool}': ${error.message}`
        )
      );
    });

    child.on("close", (exitCode: number | null) => {
      if (exitCode !== 0) {
        fail(
          new Error(
            `MCP tool '${request.tool}' exited with code ${exitCode ?? "null"}.\n${stderr.trim() || "No stderr output."}`
          )
        );
        return;
      }

      const rawOutput = stdout.trim();
      if (!rawOutput) {
        fail(new Error(`MCP tool '${request.tool}' returned empty response payload.`));
        return;
      }

      try {
        const parsed = JSON.parse(rawOutput) as unknown;
        const response = parseMcpDetectStackDeepResponse(parsed, {
          protocol: request.protocol,
          tool: request.tool,
          sessionId: request.session_id
        });
        succeed(response);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        fail(
          new Error(
            `MCP tool '${request.tool}' returned invalid JSON response: ${message}\nRaw output:\n${rawOutput}`
          )
        );
      }
    });

    child.stdin.end(JSON.stringify(request));
  });
}

async function runMcpDeepDetection(
  spec: StackDetectionSpec,
  projectRoot: string,
  sessionId: string
): Promise<StackDetectionOutcome> {
  const request: McpDetectStackDeepRequest = {
    version: 1,
    protocol: spec.detector.protocol,
    tool: spec.detector.tool,
    session_id: sessionId,
    project_root: projectRoot,
    thresholds: spec.thresholds,
    levels_required: spec.levels_required
  };
  const response = await invokeMcpDetectStackDeep(request);
  const unknownLevels = asStackLevels(
    asRecord(response.stack_context.summary, "mcp.response.stack_context.summary").unknown_levels,
    "mcp.response.stack_context.summary.unknown_levels"
  );

  return {
    selectedStack: response.selected_stack,
    confidence: response.confidence,
    decision: response.decision,
    evidence: response.evidence,
    recommendation: response.recommendation,
    source: "mcp",
    sessionId: response.session_id,
    startedAt: response.started_at,
    finishedAt: response.finished_at,
    status: "pending-confirm",
    stackContext: response.stack_context,
    unknownLevels,
    overridesApplied: false,
    ranked: response.ranked,
    matchedFiles: response.matched_files
  };
}

function hasStackOverrides(overrides: StackOverridesSpec): boolean {
  return Boolean(overrides.selected_stack_override) || overrides.edits.length > 0;
}

function applyStackOverrides(
  outcome: StackDetectionOutcome,
  overrides: StackOverridesSpec,
  thresholds: StackDetectionSpec["thresholds"],
  requiredLevels: StackLevelKey[]
): StackDetectionOutcome {
  if (!hasStackOverrides(overrides)) {
    return outcome;
  }

  const context = structuredClone(outcome.stackContext);

  for (const edit of overrides.edits) {
    const normalizedItem: StackLevelItem = {
      ...edit.item,
      source: "user",
      confidence: clampConfidence(edit.item.confidence || 1)
    };

    if (edit.action === "replace") {
      context.levels[edit.level] = [normalizedItem];
      continue;
    }

    context.levels[edit.level] = uniqueStackItems([...context.levels[edit.level], normalizedItem]);
  }

  const summary = summarizeStackConfidence(context.levels, requiredLevels);
  const selectedStack = overrides.selected_stack_override?.trim() || guessPrimaryStackId(context.levels);
  const decision = toDecision(summary.confidence, thresholds);

  context.summary = {
    primary_stack_id: selectedStack,
    confidence: summary.confidence,
    decision,
    unknown_levels: summary.unknownLevels
  };

  return {
    ...outcome,
    selectedStack: selectedStack || "unknown",
    confidence: summary.confidence,
    decision,
    recommendation: toRecommendation(decision),
    stackContext: context,
    unknownLevels: summary.unknownLevels,
    status: "edited",
    overridesApplied: true,
    evidence: [...outcome.evidence, "Результат дополнен специалистом через stack-overrides."]
  };
}

function buildDetectionSessionRecord(outcome: StackDetectionOutcome): DetectionSessionRecord {
  return {
    session_id: outcome.sessionId,
    status: outcome.status,
    started_at: outcome.startedAt,
    finished_at: outcome.finishedAt,
    result: {
      selected_stack: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision,
      evidence: outcome.evidence,
      recommendation: outcome.recommendation,
      source: "mcp",
      stack_context_ref: STACK_CONTEXT_REF,
      overrides_applied: outcome.overridesApplied
    }
  };
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

function printDetectStarted(
  spec: StackDetectionSpec,
  projectRoot: string,
  sessionId: string
): void {
  console.log(
    `docs-build: dialog event=detect-started session-id='${sessionId}' source='mcp' detector-id='${spec.detector.tool}' protocol='${spec.detector.protocol}' project-root='${projectRoot}'.`
  );
}

async function assertStackContextSchema(payload: StackContextSpec, label: string): Promise<void> {
  await validateAgainstSchema(STACK_CONTEXT_SCHEMA_PATH, payload, label);
}

async function detectStack(
  spec: StackDetectionSpec,
  projectRoot: string,
  sessionId: string
): Promise<StackDetectionOutcome> {
  return runMcpDeepDetection(spec, projectRoot, sessionId);
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
  const languageIds = outcome.stackContext.levels.languages
    .filter((item) => item.id !== "unknown")
    .map((item) => item.id);

  return {
    version: 1,
    status: "active",
    project: {
      id: projectId,
      root: projectRootValue,
      docs_installed: true,
      root_agents: {
        mode: "replace",
        overwrite: true
      }
    },
    facts: {
      files_present: outcome.matchedFiles,
      package_managers: inferPackageManagers(outcome.matchedFiles),
      languages: languageIds.length > 0 ? languageIds : inferLanguages(outcome.selectedStack),
      runtimes: {
        jetbrains: ".aiassistant",
        cursor: ".cursor"
      }
    },
    detection: {
      selected_stack: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision,
      evidence: outcome.evidence,
      source: "mcp",
      session_id: outcome.sessionId,
      status: outcome.status,
      stack_context_ref: STACK_CONTEXT_REF
    },
    governance: {
      active_commenting_profile: activeCommentingProfile,
      commenting_profiles_ref: COMMENTING_PROFILES_REF
    },
    notes: [
      "Root AGENTS.md должен заменяться install-шаблоном aagf/docs/install/AGENTS.md.",
      "Dry-run является режимом по умолчанию."
    ]
  };
}

function buildProfileLock(
  outcome: StackDetectionOutcome,
  packs: EnabledPackEntry[],
  targets: GeneratorTarget[],
  confirmed: boolean
): ProfileLockSpec {
  const activeCommentingProfile = resolveCommentingProfile(outcome.selectedStack);

  return {
    version: 1,
    locked: true,
    profile_id: outcome.selectedStack === "unknown" ? "manual-profile" : outcome.selectedStack,
    detected_stack: {
      id: outcome.selectedStack,
      confidence: outcome.confidence,
      decision: outcome.decision,
      source: "mcp",
      session_id: outcome.sessionId,
      status: outcome.status,
      stack_context_ref: STACK_CONTEXT_REF
    },
    enabled_packs: packs.filter((pack) => pack.enabled).map((pack) => pack.id),
    overrides_ref: "aagf/docs/spec/project/overrides.yaml",
    generated_targets: targets.map((target) => target.id),
    root_agents: {
      mode: "replace",
      overwrite: true,
      confirmed
    },
    governance: {
      active_commenting_profile: activeCommentingProfile,
      commenting_profiles_ref: COMMENTING_PROFILES_REF
    }
  };
}

function formatLevelItems(items: StackLevelItem[]): string {
  return items
    .filter((item) => item.id !== "unknown")
    .map((item) => (item.version ? `${item.id}@${item.version}` : item.id))
    .join(", ");
}

function printDetectionDialogSummary(outcome: StackDetectionOutcome): void {
  console.log(
    `docs-build: dialog event=detect-result session-id='${outcome.sessionId}' source='mcp' selected='${outcome.selectedStack}' confidence=${outcome.confidence.toFixed(2)} decision=${outcome.decision}.`
  );

  const orderedLevels: StackLevelKey[] = [
    "os",
    "server",
    "runtime",
    "languages",
    "frameworks",
    "libraries",
    "packages",
    "databases",
    "cache",
    "messaging",
    "ci",
    "deploy"
  ];
  const lowConfidence: string[] = [];

  for (const level of orderedLevels) {
    const value = formatLevelItems(outcome.stackContext.levels[level]);
    if (value) {
      console.log(`docs-build: dialog stack.${level}=${value}`);
    } else {
      console.log(`docs-build: dialog stack.${level}=unknown`);
    }

    for (const item of outcome.stackContext.levels[level]) {
      if (item.id === "unknown") {
        continue;
      }
      if (item.confidence < 0.6) {
        const versionPart = item.version ? `@${item.version}` : "";
        lowConfidence.push(`${level}:${item.id}${versionPart}:${item.confidence.toFixed(2)}`);
      }
    }
  }

  if (outcome.unknownLevels.length > 0) {
    console.log(`docs-build: dialog unknown-levels=${outcome.unknownLevels.join(",")}`);
  }

  if (lowConfidence.length > 0) {
    console.log(`docs-build: dialog low-confidence=${lowConfidence.join(",")}`);
  }
}

function printDetectionOutcome(outcome: StackDetectionOutcome): void {
  printDetectionDialogSummary(outcome);
  console.log(
    `docs-build: detect-stack source='mcp' selected='${outcome.selectedStack}' confidence=${outcome.confidence.toFixed(2)} decision=${outcome.decision} status='${outcome.status}'`
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
    last_session: buildDetectionSessionRecord(outcome)
  };
}

async function runDetectStackCommand(cliOptions: CliOptions): Promise<void> {
  if (cliOptions.check) {
    throw new Error("Option '--check' is not supported with command 'detect-stack'.");
  }

  if (cliOptions.confirmDetection) {
    throw new Error("Option '--confirm-detection' is supported only with command 'bootstrap'.");
  }

  const projectRoot = resolveProjectRoot(cliOptions.projectRoot);
  const spec = await readStackDetectionSpec();
  const dialogState = await resolveDetectionDialogState(
    cliOptions,
    cliOptions.apply,
    "detect-stack"
  );
  const sessionId = randomUUID();
  printDetectStarted(spec, projectRoot, sessionId);

  let outcome = await detectStack(spec, projectRoot, sessionId);
  if (dialogState.hasEdits) {
    outcome = applyStackOverrides(
      outcome,
      dialogState.overrides,
      spec.thresholds,
      spec.levels_required
    );
  } else if (dialogState.action === "confirm") {
    outcome = {
      ...outcome,
      status: "confirmed"
    };
  }
  await assertStackContextSchema(outcome.stackContext, PROJECT_STACK_CONTEXT_PATH);

  printDetectionOutcome(outcome);
  console.log(
    `docs-build: project-root='${projectRoot}', root AGENTS.md strategy=replace-from-template ('${ROOT_AGENTS_TEMPLATE_REL}').`
  );
  if (dialogState.action === null) {
    console.log(
      "docs-build: dialog action-required='confirm-or-edit' (подтвердите стек или внесите правки в stack-overrides.yaml)."
    );
  } else {
    console.log(`docs-build: dialog action='${dialogState.action}' accepted.`);
  }

  if (!cliOptions.apply) {
    console.log("docs-build: detect-stack finished in dry-run mode. No files were changed.");
    return;
  }

  const updatedSpec = withDetectionResult(spec, outcome, "apply");
  const context = buildProjectContext(outcome, projectRoot);

  await writeYamlFile(PROJECT_STACK_CONTEXT_PATH, outcome.stackContext);
  await writeYamlFile(PROJECT_STACK_DETECTION_PATH, updatedSpec);
  await writeYamlFile(PROJECT_CONTEXT_PATH, context);

  console.log(
    `docs-build: detect-stack applied updates to '${path.relative(KIT_ROOT, PROJECT_STACK_CONTEXT_PATH)}', '${path.relative(KIT_ROOT, PROJECT_STACK_DETECTION_PATH)}' and '${path.relative(KIT_ROOT, PROJECT_CONTEXT_PATH)}'.`
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
  const rootAgentsPlan = await buildRootAgentsInstallPlan(projectRoot);

  if (!docsExists) {
    throw new Error("Bootstrap Install phase failed: 'aagf/docs/' was not found in kit root.");
  }

  console.log(
    `phase Install: aagf/docs/=ok, root AGENTS.md=${rootAgentsPlan.destinationExists ? "found" : "missing"}, strategy=replace, template='${rootAgentsPlan.templateRelPath}'.`
  );

  if (dryRun) {
    if (rootAgentsPlan.needsWrite) {
      console.log("phase Install: dry-run -> would replace root AGENTS.md from install template.");
    } else {
      console.log("phase Install: dry-run -> root AGENTS.md already matches install template.");
    }
  } else if (rootAgentsPlan.needsWrite) {
    await applyRootAgentsInstallPlan(rootAgentsPlan);
    console.log("phase Install: root AGENTS.md replaced from install template.");
  } else {
    console.log("phase Install: root AGENTS.md already matches install template.");
  }

  const stackSpec = await readStackDetectionSpec();
  const dialogState = await resolveDetectionDialogState(
    cliOptions,
    !dryRun,
    "bootstrap"
  );
  const sessionId = randomUUID();
  printDetectStarted(stackSpec, projectRoot, sessionId);
  let detection = await detectStack(stackSpec, projectRoot, sessionId);
  console.log("phase Detect:");
  printDetectionOutcome(detection);

  if (dialogState.hasEdits) {
    detection = applyStackOverrides(
      detection,
      dialogState.overrides,
      stackSpec.thresholds,
      stackSpec.levels_required
    );
    console.log("phase Detect: stack-overrides applied from 'docs/spec/project/stack-overrides.yaml'.");
  }
  await assertStackContextSchema(detection.stackContext, PROJECT_STACK_CONTEXT_PATH);

  const confirmByAction = dialogState.action === "confirm";
  const editByAction = dialogState.action === "edit";
  if (dialogState.action === null) {
    console.log(
      "docs-build: dialog action-required='confirm-or-edit' (подтвердите стек --confirm-detection|--detect-action confirm или внесите правки через --detect-action edit + --detect-edit)."
    );
  } else {
    console.log(`docs-build: dialog action='${dialogState.action}' accepted.`);
  }

  const confirmSatisfied = cliOptions.confirmDetection || confirmByAction || dialogState.hasEdits;
  if (!confirmSatisfied) {
    console.log(
      "phase Confirm: explicit confirmation or stack edits are required. Re-run with --confirm-detection or provide --detect-action confirm|edit."
    );
    console.log("docs-build: bootstrap stopped at Confirm gate.");
    return;
  }

  if (!dialogState.hasEdits && (cliOptions.confirmDetection || confirmByAction)) {
    detection = {
      ...detection,
      status: "confirmed"
    };
  }

  const confirmMode = dialogState.hasEdits || editByAction ? "edit" : "confirm";
  console.log(`phase Confirm: passed (mode='${confirmMode}').`);

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
  const lock = buildProfileLock(detection, resolvedPacks, targets, confirmSatisfied);
  const updatedDetectionSpec = withDetectionResult(stackSpec, detection, dryRun ? "dry-run" : "apply");

  if (dryRun) {
    console.log(
      `phase Lock: dry-run -> would update '${path.relative(KIT_ROOT, PROJECT_STACK_CONTEXT_PATH)}', '${path.relative(KIT_ROOT, PROJECT_CONTEXT_PATH)}', '${path.relative(KIT_ROOT, PROJECT_STACK_DETECTION_PATH)}', '${path.relative(KIT_ROOT, PROJECT_PROFILE_LOCK_PATH)}'.`
    );
    return;
  }

  await writeYamlFile(PROJECT_STACK_CONTEXT_PATH, detection.stackContext);
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

function assertNoDetectionDialogOptions(command: string, options: CliOptions): void {
  const usedDetectionDialogOption =
    options.detectionAction !== null ||
    options.detectSelectedStack.trim().length > 0 ||
    options.detectEditPayloads.length > 0 ||
    options.detectNotes.length > 0;

  if (usedDetectionDialogOption) {
    throw new Error(
      `Options --detect-action, --detect-selected-stack, --detect-edit, --detect-note are supported only with 'detect-stack' and 'bootstrap'. Command='${command}'.`
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

  assertNoDetectionDialogOptions(command, cliOptions);

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
