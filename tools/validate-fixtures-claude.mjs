/**
 * Validates synthetic fixtures against `claude plugin validate`.
 *
 * Expectations:
 * - fixtures/synthetic/pass/{plugin,marketplace}/*.json => exit code 0
 * - fixtures/synthetic/fail/{plugin,marketplace}/*.json => non-zero exit code
 *
 * Runner resolution:
 * - Prefer `claude` from PATH
 * - Fallback to `npx -y @anthropic-ai/claude-code`
 *
 * Exit codes:
 * - 0: all expectations matched
 * - 1: one or more mismatches (after full-suite run)
 * - 2: setup/runtime issue (no runnable Claude CLI command)
 */

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fg from "fast-glob";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const KINDS = ["plugin", "marketplace"];
const RUNNERS = [
  { label: "claude", cmd: "claude", args: [] },
  { label: "npx:@anthropic-ai/claude-code", cmd: "npx", args: ["-y", "@anthropic-ai/claude-code"] },
];

function resolveRunner() {
  const errors = [];

  for (const runner of RUNNERS) {
    const probe = spawnSync(runner.cmd, [...runner.args, "--version"], { encoding: "utf8" });
    if (!probe.error && typeof probe.status === "number") {
      return runner;
    }
    const detail = probe.error ? probe.error.message : `unexpected status: ${probe.status}`;
    errors.push(`${runner.label} :: ${detail}`);
  }

  console.error("error: no runnable Claude CLI command found.");
  for (const line of errors) {
    console.error(`  ${line}`);
  }
  process.exit(2);
}

function runClaudeValidate(runner, file) {
  const proc = spawnSync(runner.cmd, [...runner.args, "plugin", "validate", file], {
    encoding: "utf8",
    stdio: "pipe",
  });

  if (proc.error) {
    return {
      runtimeError: proc.error.message,
      status: null,
      stdout: proc.stdout || "",
      stderr: proc.stderr || "",
    };
  }

  return {
    runtimeError: null,
    status: proc.status,
    stdout: proc.stdout || "",
    stderr: proc.stderr || "",
  };
}

const runner = resolveRunner();
console.log(`Using CLI runner: ${runner.label}`);

const mismatches = [];
const runtimeErrors = [];
let totalFiles = 0;

for (const kind of KINDS) {
  const groups = [
    { expectPass: true, files: (await fg(resolve(ROOT, `fixtures/synthetic/pass/${kind}/*.json`))).sort() },
    { expectPass: false, files: (await fg(resolve(ROOT, `fixtures/synthetic/fail/${kind}/*.json`))).sort() },
  ];

  for (const { expectPass, files } of groups) {
    for (const file of files) {
      totalFiles += 1;
      const result = runClaudeValidate(runner, file);

      if (result.runtimeError) {
        runtimeErrors.push({ file, error: result.runtimeError });
        continue;
      }

      const expected = expectPass ? "pass" : "fail";
      const actual = result.status === 0 ? "pass" : "fail";

      if (expected !== actual) {
        mismatches.push({
          file,
          kind,
          expected,
          actual,
          status: result.status,
          stdout: result.stdout.trim(),
          stderr: result.stderr.trim(),
        });
      }
    }
  }
}

if (runtimeErrors.length > 0) {
  console.error("Runtime errors while invoking `claude plugin validate`:");
  for (const e of runtimeErrors) {
    console.error(`  ${e.file} :: ${e.error}`);
  }
  process.exit(2);
}

if (mismatches.length > 0) {
  console.error("Fixture validation mismatches against `claude plugin validate`:");
  for (const m of mismatches) {
    console.error(`  ${m.file}`);
    console.error(`    expected=${m.expected} actual=${m.actual} exitCode=${m.status}`);
    if (m.stderr) {
      console.error(`    stderr: ${m.stderr}`);
    }
    if (m.stdout) {
      console.error(`    stdout: ${m.stdout}`);
    }
  }
  console.error(`Summary: ${mismatches.length} mismatches across ${totalFiles} fixture files.`);
  process.exit(1);
}

console.log(`All synthetic fixtures matched Claude CLI expectations. (${totalFiles} files)`);
