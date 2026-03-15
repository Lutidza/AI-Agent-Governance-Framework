/**
 * @file tools/src/tests/detect-contract.ts
 * @version 1.1.0
 * @edited_at 2026-03-15 17:26
 * Контрактные тесты bootstrap/detect диалога и confirm/edit gate в CLI AAGF.
 * @remarks Изменения в версии 1.1.0: добавлены langDoc-комментарии, таймаут выполнения дочернего CLI и кросс-платформенная нормализация путей в match-проверках.
 */
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
const CLI_TIMEOUT_MS = 30_000;
const EDIT_PAYLOAD =
  "{level: frameworks, action: add, item: {id: react, version: ^19.0.0, confidence: 0.9, evidence: [Contract edit]}}";

/**
 * Нормализует разделители путей для кросс-платформенных строковых сравнений.
 * @param value Исходная строка.
 * @returns Строка с разделителями `/`.
 * @remarks Упрощает сравнение stdout/stderr между Windows и Unix.
 */
function normalizePathSeparators(value: string): string {
  return value.replace(/\\/g, "/");
}

/**
 * Запускает CLI-команду и возвращает stdout/stderr + код завершения.
 * @param args Аргументы CLI после `tools/src/cli.ts`.
 * @returns Результат выполнения дочернего процесса.
 * @throws Error При ошибке spawn или превышении таймаута.
 * @remarks Таймаут защищает контрактный прогон от зависаний.
 */
async function runCli(args: string[]): Promise<ContractResult> {
  return await new Promise<ContractResult>((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", CLI_PATH, ...args], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"]
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (callback: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      callback();
    };

    const timer = setTimeout(() => {
      finish(() => {
        child.kill();
        reject(
          new Error(
            `detect-contract: CLI timeout after ${CLI_TIMEOUT_MS}ms for args='${args.join(" ")}'.`
          )
        );
      });
    }, CLI_TIMEOUT_MS);

    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");

    child.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    child.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (error: Error) => {
      finish(() => reject(error));
    });

    child.on("close", (exitCode: number | null) => {
      finish(() =>
        resolve({
          exitCode: exitCode ?? -1,
          stdout,
          stderr
        })
      );
    });
  });
}

/**
 * Проверяет, что строка содержит ожидаемый маркер (с нормализацией путей).
 * @param haystack Полный текст вывода.
 * @param needle Обязательный фрагмент.
 * @param label Имя тест-кейса для диагностики.
 * @returns `void`.
 * @throws Error Если маркер не найден.
 * @remarks Сравнение выполняется после нормализации `\` -> `/`.
 */
function assertIncludes(haystack: string, needle: string, label: string): void {
  const normalizedHaystack = normalizePathSeparators(haystack);
  const normalizedNeedle = normalizePathSeparators(needle);

  if (!normalizedHaystack.includes(normalizedNeedle)) {
    throw new Error(`${label}: expected output to include '${needle}'.`);
  }
}

/**
 * Проверяет, что строка не содержит запрещенный маркер (с нормализацией путей).
 * @param haystack Полный текст вывода.
 * @param needle Запрещенный фрагмент.
 * @param label Имя тест-кейса для диагностики.
 * @returns `void`.
 * @throws Error Если запрещенный маркер найден.
 * @remarks Сравнение выполняется после нормализации `\` -> `/`.
 */
function assertNotIncludes(haystack: string, needle: string, label: string): void {
  const normalizedHaystack = normalizePathSeparators(haystack);
  const normalizedNeedle = normalizePathSeparators(needle);

  if (normalizedHaystack.includes(normalizedNeedle)) {
    throw new Error(`${label}: expected output NOT to include '${needle}'.`);
  }
}

/**
 * Выполняет один контрактный кейс и валидирует код завершения и маркеры вывода.
 * @param contractCase Описание тест-кейса.
 * @returns `void`.
 * @throws Error Если нарушены ожидания по коду завершения или маркерам.
 * @remarks Ошибка включает полный вывод процесса для ускоренной диагностики.
 */
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

/**
 * Точка оркестрации полного набора detect/bootstrap контрактных тестов.
 * @returns `void`.
 * @throws Error Если хотя бы один кейс завершился с ошибкой.
 * @remarks Набор кейсов покрывает unknown-gate, confirm-flow и edit-flow.
 */
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
        "bootstrap: dry-run -> would save dialog edits to 'docs/spec/project/stack-overrides.yaml'.",
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

/**
 * Запуск main с нормализованным сообщением ошибки и корректным exit code.
 * @returns `void`.
 * @remarks Не скрывает исходную причину падения контрактного теста.
 */
main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`detect-contract: ${message}`);
  process.exitCode = 1;
});
