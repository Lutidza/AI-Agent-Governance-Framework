import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

type DetectionDecision = "auto" | "confirm" | "unknown";

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

type RankedCandidate = {
  id: string;
  title: string;
  confidence: number;
  evidence: string[];
};

type McpDetectStackDeepRequest = {
  version: number;
  protocol: string;
  tool: string;
  session_id: string;
  project_root: string;
  thresholds: {
    auto: number;
    confirm: number;
  };
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

type MarkerScope = "dependencies" | "devDependencies" | "any";

const STACK_LEVEL_KEYS: StackLevelKey[] = [
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

function clampConfidence(value: number): number {
  return Math.min(1, Math.max(0, Number(value.toFixed(2))));
}

function toDecision(
  confidence: number,
  thresholds: McpDetectStackDeepRequest["thresholds"]
): DetectionDecision {
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

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readPackageJsonMaybe(
  projectRoot: string
): Promise<Record<string, unknown> | null> {
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

function getDependencyVersion(
  packageJson: Record<string, unknown> | null,
  dependency: string,
  scope: MarkerScope = "any"
): string {
  if (!packageJson) {
    return "";
  }

  const dependencies = getDependencyMap(packageJson, "dependencies");
  const devDependencies = getDependencyMap(packageJson, "devDependencies");

  if (scope === "dependencies") {
    return dependencies[dependency] ?? "";
  }

  if (scope === "devDependencies") {
    return devDependencies[dependency] ?? "";
  }

  return dependencies[dependency] ?? devDependencies[dependency] ?? "";
}

function hasPackageDependency(
  packageJson: Record<string, unknown> | null,
  dependency: string,
  scope: MarkerScope = "any"
): boolean {
  return getDependencyVersion(packageJson, dependency, scope).length > 0;
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

function createStackItem(
  id: string,
  version: string,
  confidence: number,
  source: "mcp" | "user",
  evidence: string[]
): StackLevelItem {
  return {
    id,
    version,
    confidence: clampConfidence(confidence),
    source,
    evidence
  };
}

function createUnknownItem(level: StackLevelKey): StackLevelItem {
  return createStackItem(
    "unknown",
    "",
    0,
    "mcp",
    [`Признаки уровня '${level}' не обнаружены.`]
  );
}

function levelConfidence(items: StackLevelItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  return items.reduce((max, item) => Math.max(max, item.confidence), 0);
}

function collectDependencySnapshot(
  packageJson: Record<string, unknown> | null
): Record<string, string> {
  if (!packageJson) {
    return {};
  }

  return {
    ...getDependencyMap(packageJson, "dependencies"),
    ...getDependencyMap(packageJson, "devDependencies")
  };
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

function asObject(value: unknown, label: string): Record<string, unknown> {
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

function isStackLevelKey(value: string): value is StackLevelKey {
  return STACK_LEVEL_KEYS.includes(value as StackLevelKey);
}

function parseRequest(payload: unknown): McpDetectStackDeepRequest {
  const raw = asObject(payload, "request");
  const thresholdsRaw = asObject(raw.thresholds, "request.thresholds");

  const levelsRaw = raw.levels_required;
  if (!Array.isArray(levelsRaw) || levelsRaw.length === 0) {
    throw new Error("request.levels_required MUST be a non-empty array.");
  }

  const levels: StackLevelKey[] = [];
  for (const level of levelsRaw) {
    if (typeof level !== "string" || !isStackLevelKey(level)) {
      throw new Error(`request.levels_required contains unknown level '${String(level)}'.`);
    }
    levels.push(level);
  }

  const uniqueLevels = new Set(levels);
  if (uniqueLevels.size !== levels.length) {
    throw new Error("request.levels_required MUST NOT contain duplicate levels.");
  }

  const thresholds = {
    auto: asNumber(thresholdsRaw.auto, "request.thresholds.auto"),
    confirm: asNumber(thresholdsRaw.confirm, "request.thresholds.confirm")
  };

  if (thresholds.auto < 0 || thresholds.auto > 1) {
    throw new Error("request.thresholds.auto MUST be in range [0..1].");
  }

  if (thresholds.confirm < 0 || thresholds.confirm > 1) {
    throw new Error("request.thresholds.confirm MUST be in range [0..1].");
  }

  if (thresholds.confirm > thresholds.auto) {
    throw new Error("request.thresholds.confirm MUST be <= request.thresholds.auto.");
  }

  return {
    version: asNumber(raw.version, "request.version"),
    protocol: asString(raw.protocol, "request.protocol"),
    tool: asString(raw.tool, "request.tool"),
    session_id: asString(raw.session_id, "request.session_id"),
    project_root: asString(raw.project_root, "request.project_root"),
    thresholds,
    levels_required: levels
  };
}

async function readStdin(): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk: string) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      resolve(data);
    });
    process.stdin.on("error", reject);
  });
}

async function detectStackDeep(
  request: McpDetectStackDeepRequest
): Promise<McpDetectStackDeepResponse> {
  const startedAt = new Date().toISOString();
  const projectRoot = request.project_root;
  const matchedFiles = new Set<string>();
  const packageJson = await readPackageJsonMaybe(projectRoot);
  const dependencySnapshot = collectDependencySnapshot(packageJson);

  const levels: Record<StackLevelKey, StackLevelItem[]> = {
    os: [],
    server: [],
    runtime: [],
    languages: [],
    frameworks: [],
    libraries: [],
    packages: [],
    databases: [],
    cache: [],
    messaging: [],
    ci: [],
    deploy: []
  };

  const osMap: Record<string, string> = {
    win32: "windows",
    linux: "linux",
    darwin: "macos"
  };
  levels.os.push(
    createStackItem(
      osMap[process.platform] ?? process.platform,
      "",
      0.95,
      "mcp",
      [`Определено через process.platform='${process.platform}'.`]
    )
  );

  if (await pathExists(path.join(projectRoot, "nginx.conf"))) {
    levels.server.push(createStackItem("nginx", "", 0.9, "mcp", ["Обнаружен nginx.conf."]));
    matchedFiles.add("nginx.conf");
  }
  if (await pathExists(path.join(projectRoot, "Caddyfile"))) {
    levels.server.push(createStackItem("caddy", "", 0.9, "mcp", ["Обнаружен Caddyfile."]));
    matchedFiles.add("Caddyfile");
  }
  if (await pathExists(path.join(projectRoot, ".htaccess"))) {
    levels.server.push(createStackItem("apache", "", 0.85, "mcp", ["Обнаружен .htaccess."]));
    matchedFiles.add(".htaccess");
  }

  if (await pathExists(path.join(projectRoot, "package.json"))) {
    levels.runtime.push(createStackItem("node", "", 0.9, "mcp", ["Обнаружен package.json."]));
    matchedFiles.add("package.json");
  }
  if (await pathExists(path.join(projectRoot, "pyproject.toml"))) {
    levels.runtime.push(createStackItem("python", "", 0.9, "mcp", ["Обнаружен pyproject.toml."]));
    matchedFiles.add("pyproject.toml");
  }
  if (await pathExists(path.join(projectRoot, "go.mod"))) {
    levels.runtime.push(createStackItem("go", "", 0.9, "mcp", ["Обнаружен go.mod."]));
    matchedFiles.add("go.mod");
  }
  if (await pathExists(path.join(projectRoot, "Cargo.toml"))) {
    levels.runtime.push(createStackItem("rust", "", 0.9, "mcp", ["Обнаружен Cargo.toml."]));
    matchedFiles.add("Cargo.toml");
  }
  if (await pathExists(path.join(projectRoot, "composer.json"))) {
    levels.runtime.push(createStackItem("php", "", 0.9, "mcp", ["Обнаружен composer.json."]));
    matchedFiles.add("composer.json");
  }
  if (await pathExists(path.join(projectRoot, "pubspec.yaml"))) {
    levels.runtime.push(createStackItem("dart", "", 0.9, "mcp", ["Обнаружен pubspec.yaml."]));
    matchedFiles.add("pubspec.yaml");
  }

  if (levels.runtime.some((item) => item.id === "node")) {
    levels.languages.push(createStackItem("javascript", "", 0.85, "mcp", ["Node runtime обнаружен."]));
    if (
      (await pathExists(path.join(projectRoot, "tsconfig.json"))) ||
      hasPackageDependency(packageJson, "typescript")
    ) {
      levels.languages.push(
        createStackItem(
          "typescript",
          getDependencyVersion(packageJson, "typescript"),
          0.9,
          "mcp",
          [
            (await pathExists(path.join(projectRoot, "tsconfig.json")))
              ? "Обнаружен tsconfig.json."
              : "Обнаружена зависимость typescript."
          ]
        )
      );
      if (await pathExists(path.join(projectRoot, "tsconfig.json"))) {
        matchedFiles.add("tsconfig.json");
      }
    }
  }
  if (levels.runtime.some((item) => item.id === "python")) {
    levels.languages.push(createStackItem("python", "", 0.9, "mcp", ["Python runtime обнаружен."]));
  }
  if (levels.runtime.some((item) => item.id === "go")) {
    levels.languages.push(createStackItem("go", "", 0.9, "mcp", ["Go runtime обнаружен."]));
  }
  if (levels.runtime.some((item) => item.id === "rust")) {
    levels.languages.push(createStackItem("rust", "", 0.9, "mcp", ["Rust runtime обнаружен."]));
  }
  if (levels.runtime.some((item) => item.id === "php")) {
    levels.languages.push(createStackItem("php", "", 0.9, "mcp", ["PHP runtime обнаружен."]));
  }
  if (levels.runtime.some((item) => item.id === "dart")) {
    levels.languages.push(createStackItem("dart", "", 0.9, "mcp", ["Dart runtime обнаружен."]));
  }

  const frameworkDeps: Array<{ dep: string; id: string }> = [
    { dep: "next", id: "nextjs" },
    { dep: "react", id: "react" },
    { dep: "vue", id: "vue" },
    { dep: "nuxt", id: "nuxt" },
    { dep: "@angular/core", id: "angular" },
    { dep: "@nestjs/core", id: "nestjs" },
    { dep: "express", id: "express" },
    { dep: "fastify", id: "fastify" },
    { dep: "@sveltejs/kit", id: "sveltekit" }
  ];
  for (const item of frameworkDeps) {
    const version = getDependencyVersion(packageJson, item.dep);
    if (version) {
      levels.frameworks.push(
        createStackItem(item.id, version, 0.88, "mcp", [`Обнаружена зависимость ${item.dep}.`])
      );
    }
  }

  const libraryDeps: Array<{ dep: string; id: string }> = [
    { dep: "typescript", id: "typescript" },
    { dep: "axios", id: "axios" },
    { dep: "zod", id: "zod" },
    { dep: "lodash", id: "lodash" },
    { dep: "rxjs", id: "rxjs" }
  ];
  for (const item of libraryDeps) {
    const version = getDependencyVersion(packageJson, item.dep);
    if (version) {
      levels.libraries.push(
        createStackItem(item.id, version, 0.82, "mcp", [`Обнаружена зависимость ${item.dep}.`])
      );
    }
  }

  for (const dependencyName of Object.keys(dependencySnapshot).sort((left, right) => left.localeCompare(right)).slice(0, 20)) {
    levels.packages.push(
      createStackItem(
        dependencyName,
        dependencySnapshot[dependencyName],
        0.75,
        "mcp",
        [`Обнаружен пакет ${dependencyName}.`]
      )
    );
  }

  const databaseDeps: Array<{ dep: string; id: string }> = [
    { dep: "pg", id: "postgresql" },
    { dep: "mysql2", id: "mysql" },
    { dep: "mongoose", id: "mongodb" },
    { dep: "mongodb", id: "mongodb" },
    { dep: "@prisma/client", id: "prisma" },
    { dep: "sqlite3", id: "sqlite" },
    { dep: "better-sqlite3", id: "sqlite" },
    { dep: "typeorm", id: "typeorm" },
    { dep: "sequelize", id: "sequelize" }
  ];
  for (const item of databaseDeps) {
    const version = getDependencyVersion(packageJson, item.dep);
    if (version) {
      levels.databases.push(
        createStackItem(item.id, version, 0.85, "mcp", [`Обнаружена зависимость ${item.dep}.`])
      );
    }
  }

  const cacheDeps: Array<{ dep: string; id: string }> = [
    { dep: "redis", id: "redis" },
    { dep: "ioredis", id: "redis" },
    { dep: "memcached", id: "memcached" },
    { dep: "node-cache", id: "node-cache" }
  ];
  for (const item of cacheDeps) {
    const version = getDependencyVersion(packageJson, item.dep);
    if (version) {
      levels.cache.push(
        createStackItem(item.id, version, 0.8, "mcp", [`Обнаружена зависимость ${item.dep}.`])
      );
    }
  }

  const messagingDeps: Array<{ dep: string; id: string }> = [
    { dep: "amqplib", id: "rabbitmq" },
    { dep: "kafkajs", id: "kafka" },
    { dep: "nats", id: "nats" },
    { dep: "bullmq", id: "bullmq" }
  ];
  for (const item of messagingDeps) {
    const version = getDependencyVersion(packageJson, item.dep);
    if (version) {
      levels.messaging.push(
        createStackItem(item.id, version, 0.8, "mcp", [`Обнаружена зависимость ${item.dep}.`])
      );
    }
  }

  if (await pathExists(path.join(projectRoot, ".github", "workflows"))) {
    levels.ci.push(createStackItem("github-actions", "", 0.9, "mcp", ["Обнаружен .github/workflows/."]));
    matchedFiles.add(".github/workflows");
  }
  if (await pathExists(path.join(projectRoot, ".gitlab-ci.yml"))) {
    levels.ci.push(createStackItem("gitlab-ci", "", 0.9, "mcp", ["Обнаружен .gitlab-ci.yml."]));
    matchedFiles.add(".gitlab-ci.yml");
  }
  if (await pathExists(path.join(projectRoot, "Jenkinsfile"))) {
    levels.ci.push(createStackItem("jenkins", "", 0.85, "mcp", ["Обнаружен Jenkinsfile."]));
    matchedFiles.add("Jenkinsfile");
  }

  if (await pathExists(path.join(projectRoot, "Dockerfile"))) {
    levels.deploy.push(createStackItem("docker", "", 0.9, "mcp", ["Обнаружен Dockerfile."]));
    matchedFiles.add("Dockerfile");
  }
  if (
    (await pathExists(path.join(projectRoot, "docker-compose.yml"))) ||
    (await pathExists(path.join(projectRoot, "docker-compose.yaml")))
  ) {
    levels.deploy.push(createStackItem("docker-compose", "", 0.85, "mcp", ["Обнаружен docker-compose файл."]));
    if (await pathExists(path.join(projectRoot, "docker-compose.yml"))) {
      matchedFiles.add("docker-compose.yml");
    }
    if (await pathExists(path.join(projectRoot, "docker-compose.yaml"))) {
      matchedFiles.add("docker-compose.yaml");
    }
  }
  if (
    (await pathExists(path.join(projectRoot, "k8s"))) ||
    (await pathExists(path.join(projectRoot, "kubernetes")))
  ) {
    levels.deploy.push(createStackItem("kubernetes", "", 0.85, "mcp", ["Обнаружен каталог k8s/kubernetes."]));
    if (await pathExists(path.join(projectRoot, "k8s"))) {
      matchedFiles.add("k8s");
    }
    if (await pathExists(path.join(projectRoot, "kubernetes"))) {
      matchedFiles.add("kubernetes");
    }
  }

  for (const levelKey of STACK_LEVEL_KEYS) {
    levels[levelKey] = uniqueStackItems(levels[levelKey]);
    if (levels[levelKey].length === 0) {
      levels[levelKey] = [createUnknownItem(levelKey)];
    }
  }

  const summary = summarizeStackConfidence(levels, request.levels_required);
  const primaryStackId = guessPrimaryStackId(levels);
  const decision = toDecision(summary.confidence, request.thresholds);
  const selectedStack = decision === "unknown" ? "unknown" : primaryStackId;
  const finishedAt = new Date().toISOString();

  const stackContext: StackContextSpec = {
    version: 1,
    source: "mcp",
    session_id: request.session_id,
    detected_at: startedAt,
    levels,
    summary: {
      primary_stack_id: primaryStackId,
      confidence: summary.confidence,
      decision,
      unknown_levels: summary.unknownLevels
    }
  };

  const runtimeEvidence = levels.runtime
    .filter((item) => item.id !== "unknown")
    .flatMap((item) => item.evidence);
  const frameworkEvidence = levels.frameworks
    .filter((item) => item.id !== "unknown")
    .flatMap((item) => item.evidence)
    .slice(0, 4);
  const evidence = [...runtimeEvidence, ...frameworkEvidence];

  const recommendation = toRecommendation(decision);
  const normalizedEvidence = evidence.length > 0
    ? evidence
    : ["Глубокий MCP-анализ не дал достаточно признаков для уверенного выбора стека."];

  return {
    version: 1,
    protocol: request.protocol,
    tool: request.tool,
    session_id: request.session_id,
    source: "mcp",
    started_at: startedAt,
    finished_at: finishedAt,
    selected_stack: selectedStack,
    confidence: summary.confidence,
    decision,
    evidence: normalizedEvidence,
    recommendation,
    stack_context: stackContext,
    matched_files: [...matchedFiles].sort((left, right) => left.localeCompare(right)),
    ranked: [
      {
        id: primaryStackId,
        title: primaryStackId,
        confidence: summary.confidence,
        evidence: normalizedEvidence
      }
    ]
  };
}

async function main(): Promise<void> {
  const rawInput = (await readStdin()).trim();
  if (!rawInput) {
    throw new Error("MCP detect_stack_deep request payload is empty.");
  }

  const parsedPayload = JSON.parse(rawInput) as unknown;
  const request = parseRequest(parsedPayload);
  const response = await detectStackDeep(request);
  process.stdout.write(JSON.stringify(response));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`mcp.detect_stack_deep: ${message}\n`);
  process.exitCode = 1;
});
