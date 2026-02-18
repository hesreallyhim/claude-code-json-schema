/**
 * Validates synthetic fixtures against canonical schemas.
 *
 * - fixtures/synthetic/pass/{plugin,marketplace}/*.json must pass
 * - fixtures/synthetic/fail/{plugin,marketplace}/*.json must fail
 *
 * Exit 1 on any mismatch.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import fg from "fast-glob";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const KINDS = ["plugin", "marketplace"];

const SCHEMA_PATHS = {
  plugin: resolve(ROOT, "schemas/plugin.schema.json"),
  marketplace: resolve(ROOT, "schemas/marketplace.schema.json"),
};

function buildValidators() {
  const validators = {};
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);
  for (const kind of KINDS) {
    const schema = JSON.parse(fs.readFileSync(SCHEMA_PATHS[kind], "utf8"));
    validators[kind] = ajv.compile(schema);
  }
  return validators;
}

const validators = buildValidators();
const mismatches = [];
let totalFiles = 0;

for (const kind of KINDS) {
  const groups = [
    { expectPass: true, files: (await fg(resolve(ROOT, `fixtures/synthetic/pass/${kind}/*.json`))).sort() },
    { expectPass: false, files: (await fg(resolve(ROOT, `fixtures/synthetic/fail/${kind}/*.json`))).sort() },
  ];

  for (const { expectPass, files } of groups) {
    for (const file of files) {
      totalFiles += 1;
      const data = JSON.parse(fs.readFileSync(file, "utf8"));

      const validate = validators[kind];
      const ok = validate(data);
      const expected = expectPass ? "pass" : "fail";
      const actual = ok ? "pass" : "fail";

      if (expected !== actual) {
        const firstErr = validate.errors?.[0];
        const errMsg = firstErr
          ? `${firstErr.keyword} at ${firstErr.instancePath || "/"}: ${firstErr.message}`
          : "(no details)";
        mismatches.push({ file, kind, expected, actual, errMsg });
      }
    }
  }
}

if (mismatches.length) {
  console.error("Fixture validation mismatches:");
  for (const m of mismatches) {
    console.error(`  ${m.file} expected=${m.expected} actual=${m.actual} :: ${m.errMsg}`);
  }
  process.exit(1);
}

console.log(`All synthetic fixtures passed. (${totalFiles} files)`);
