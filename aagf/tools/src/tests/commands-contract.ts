/**
 * @file tools/src/tests/commands-contract.ts
 * @version 1.0.0
 * @edited_at 2026-03-15 20:45
 * Контрактные проверки machine-readable command catalog и вывода CLI-команды `commands`.
 * @remarks Изменения в версии 1.0.0: добавлен первичный контракт для валидации схемы, обязательных команд и safety-конвенций.
 */
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import Ajv2020 from "ajv/dist/2020";
import YAML from "yaml";

type CommandCatalogParam = {
  name: string;
  type: string;
  required: boolean;
  description: string;
};

type CommandCatalogEntry = {
  id: string;
  syntax: string;
  intent: string;
  scope: string;
  mode: "review" | "fix" | "mixed";
  params: CommandCatalogParam[];
  safety_gate: {
    confirm_required: boolean;
    details: string;
  };
  output: {
    format: string;
    fields: string[];
  };
  examples: Array<{
    prompt: string;
    result: string;
  }>;
};

type CommandCatalogSpec = {
  version: number;
  catalog_id: string;
  defaults: {
    mode: "review" | "fix";
    output_format: string;
    confirm_fix: boolean;
  };
  commands: CommandCatalogEntry[];
};

type CliResult = {
  exitCode: number;
  output: string;
};

const KIT_ROOT = process.cwd();
const CLI_PATH = path.join(KIT_ROOT, "tools/src/cli.ts");
const CATALOG_PATH = path.join(KIT_ROOT, "docs/spec/project/commands.catalog.yaml");
const SCHEMA_PATH = path.join(KIT_ROOT, "docs/spec/schemas/command-catalog.schema.json");
const REQUIRED_COMMAND_IDS = [
  "AAFG-CMD-HELP",
  "AAFG-CMD-COMMAND",
  "AAFG-CMD-DEFAULTS",
  "AAFG-CMD-TEST",
  "AAFG-CMD-FILE-REVIEW",
  "AAFG-CMD-FILE-FIX",
  "AAFG-CMD-RULE-EXPLAIN",
  "AAFG-CMD-RULES-TEST",
  "AAFG-CMD-DOCS-SYNC"
];

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

async function readCatalog(): Promise<CommandCatalogSpec> {
  const raw = await readFile(CATALOG_PATH, "utf8");
  return YAML.parse(raw) as CommandCatalogSpec;
}

async function validateCatalogSchema(catalog: CommandCatalogSpec): Promise<void> {
  const schema = JSON.parse(await readFile(SCHEMA_PATH, "utf8")) as object;
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  const validate = ajv.compile(schema);

  if (!validate(catalog)) {
    const details = (validate.errors ?? [])
      .map((issue) => `${issue.instancePath || "/"}: ${issue.message}`)
      .join("\n");
    throw new Error(`commands-contract: schema validation failed:\n${details}`);
  }
}

function assertCatalogConventions(catalog: CommandCatalogSpec): void {
  assert(
    catalog.defaults.mode === "review",
    "commands-contract: defaults.mode MUST be 'review'."
  );
  assert(catalog.defaults.confirm_fix, "commands-contract: defaults.confirm_fix MUST be true.");

  const seenIds = new Set<string>();
  for (const command of catalog.commands) {
    assert(!seenIds.has(command.id), `commands-contract: duplicate command id '${command.id}'.`);
    seenIds.add(command.id);

    assert(
      command.syntax.startsWith("aafg ") || command.syntax.startsWith("aafg:"),
      `commands-contract: command '${command.id}' syntax must start with 'aafg ' or 'aafg:'.`
    );

    if (command.mode === "fix") {
      assert(
        command.safety_gate.confirm_required,
        `commands-contract: fix command '${command.id}' must require confirm gate.`
      );
    }
  }

  for (const commandId of REQUIRED_COMMAND_IDS) {
    assert(
      seenIds.has(commandId),
      `commands-contract: required command '${commandId}' is missing in catalog.`
    );
  }
}

async function runCliCommandsList(): Promise<CliResult> {
  return await new Promise<CliResult>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", CLI_PATH, "commands"], {
      cwd: KIT_ROOT,
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (exitCode: number | null) => {
      resolve({
        exitCode: exitCode ?? -1,
        output: `${stdout}\n${stderr}`
      });
    });
  });
}

async function runCliCommandDebug(input: string): Promise<CliResult> {
  return await new Promise<CliResult>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", CLI_PATH, "command-debug", "--input", input],
      {
        cwd: KIT_ROOT,
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", reject);
    child.on("close", (exitCode: number | null) => {
      resolve({
        exitCode: exitCode ?? -1,
        output: `${stdout}\n${stderr}`
      });
    });
  });
}

async function main(): Promise<void> {
  const catalog = await readCatalog();
  await validateCatalogSchema(catalog);
  assertCatalogConventions(catalog);
  console.log(`commands-contract: catalog checks passed (commands=${catalog.commands.length}).`);

  const cliResult = await runCliCommandsList();
  assert(cliResult.exitCode === 0, `commands-contract: cli commands failed.\n${cliResult.output}`);

  for (const commandId of REQUIRED_COMMAND_IDS) {
    assert(
      cliResult.output.includes(commandId),
      `commands-contract: CLI output does not include '${commandId}'.`
    );
  }

  const debugResult = await runCliCommandDebug("aafg:test docs/spec/README.md fix");
  assert(
    debugResult.exitCode === 0,
    `commands-contract: command-debug failed.\n${debugResult.output}`
  );
  assert(
    debugResult.output.includes("resolved_command='AAFG-CMD-FILE-FIX'"),
    "commands-contract: command-debug did not resolve file-fix command."
  );
  assert(
    debugResult.output.includes("confirm_required_for_real_fix=true"),
    "commands-contract: command-debug did not expose confirm gate for fix mode."
  );

  console.log("commands-contract: cli commands output checks passed.");
  console.log("commands-contract: all checks passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
