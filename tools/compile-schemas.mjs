/**
 * Compiles canonical public schemas in Ajv strict mode.
 */

import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const ajv = new Ajv({ strict: true, allErrors: true });
addFormats(ajv);

const schemaPaths = [
  "schemas/plugin.schema.json",
  "schemas/marketplace.schema.json",
];

for (const p of schemaPaths) {
  const abs = resolve(ROOT, p);
  const schema = JSON.parse(fs.readFileSync(abs, "utf8"));
  ajv.compile(schema);
  console.log(`✅ Compiled: ${p}`);
}

console.log("✅ Schemas compile (Ajv strict mode).");
