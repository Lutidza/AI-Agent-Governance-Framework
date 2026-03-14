import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

type ContractCase = {
  name: string;
  args: string[];
  expectedCode?: number;
  mustInclude: string[];
  mustNotInclude?: string[];
};

type ContractResult = {
  exitCode: number;
  stdout: string;
  stderr: string;
};

const CLI_PATH = path.join(process.cwd(), "tools/src/cli.ts");
const EDIT_PAYLOAD =
  "{level: frameworks, action: add, item: {id: react, version: ^19.0.0, confidence: 0.9, evidence: [Contract edit]}}";

async function runCli(args: string[]): Promise<ContractResult> {
  return await new Promise<ContractResult>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", CLI_PATH, ...args],
      {
        cwd: process.cwd(),
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
        stdout,
        stderr
      });
    });
  });
}

function assertIncludes(haystack: string, needle: string, label: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`${label}: expected output to include '${needle}'.`);
  }
}

function assertNotIncludes(haystack: string, needle: string, label: string): void {
  if (haystack.includes(needle)) {
    throw new Error(`${label}: expected output NOT to include '${needle}'.`);
  }
}

async function runCase(contractCase: ContractCase): Promise<void> {
  const result = await runCli(contractCase.args);
  const expectedCode = contractCase.expectedCode ?? 0;
  const output = `${result.stdout}\n${result.stderr}`.trim();

  if (result.exitCode !== expectedCode) {
    throw new Error(
      `${contractCase.name}: expected exit code ${expectedCode}, got ${result.exitCode}.\nOutput:\n${output}`
    );
  }

  for (const marker of contractCase.mustInclude) {
    assertIncludes(output, marker, contractCase.name);
  }

  for (const marker of contractCase.mustNotInclude ?? []) {
    assertNotIncludes(output, marker, contractCase.name);
  }

  console.log(`detect-contract: case='${contractCase.name}' passed.`);
}

async function main(): Promise<void> {
  const cases: ContractCase[] = [
    {
      name: "unknown-gate",
      args: ["bootstrap", "--project-root", "..", "--guided"],
      mustInclude: [
        "docs-build: dialog action-required='confirm-or-edit'",
        "phase Confirm: explicit confirmation or stack edits are required.",
        "docs-build: bootstrap stopped at Confirm gate."
      ]
    },
    {
      name: "confirm-flow",
      args: ["bootstrap", "--project-root", "..", "--guided", "--detect-action", "confirm"],
      mustInclude: [
        "docs-build: dialog action='confirm' accepted.",
        "phase Confirm: passed (mode='confirm')."
      ],
      mustNotInclude: ["docs-build: bootstrap stopped at Confirm gate."]
    },
    {
      name: "edit-flow",
      args: [
        "bootstrap",
        "--project-root",
        "..",
        "--guided",
        "--detect-action",
        "edit",
        "--detect-selected-stack",
        "node-typescript",
        "--detect-edit",
        EDIT_PAYLOAD
      ],
      mustInclude: [
        "bootstrap: dry-run -> would save dialog edits to 'docs\\spec\\project\\stack-overrides.yaml'.",
        "docs-build: dialog action='edit' accepted.",
        "phase Confirm: passed (mode='edit')."
      ],
      mustNotInclude: ["docs-build: bootstrap stopped at Confirm gate."]
    }
  ];

  for (const contractCase of cases) {
    await runCase(contractCase);
  }

  console.log(`detect-contract: all cases passed (${cases.length}).`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`detect-contract: ${message}`);
  process.exitCode = 1;
});
