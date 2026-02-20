import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const evidencePath = resolve(ROOT, "docs/FIXTURE-EVIDENCE.json");
const mappingsPath = resolve(ROOT, "docs/SYNC-DEVIATIONS-MAPPINGS.json");

const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
const mappingDoc = JSON.parse(readFileSync(mappingsPath, "utf8"));

function assertionKey(conditionId, assertion) {
  return `${conditionId}::${assertion.role}::${assertion.expected}::${assertion.fixture}`;
}

const evidenceAssertions = [];
for (const condition of evidence.conditions || []) {
  for (const assertion of condition.assertions || []) {
    evidenceAssertions.push({
      key: assertionKey(condition.id, assertion),
      conditionId: condition.id,
      fixturePath: assertion.fixture,
      role: assertion.role,
      expected: assertion.expected,
    });
  }
}

const mappingAssertions = (mappingDoc.mappings || []).map((mapping) => ({
  key: `${mapping.conditionId}::${mapping.role}::${mapping.expected}::${mapping.fixturePath}`,
  mappingId: mapping.mappingId,
  fixturePath: mapping.fixturePath,
}));

const evidenceSet = new Set(evidenceAssertions.map((row) => row.key));
const mappingSet = new Set(mappingAssertions.map((row) => row.key));

const missingMappings = evidenceAssertions.filter((row) => !mappingSet.has(row.key));
const unmappedExtras = mappingAssertions.filter((row) => !evidenceSet.has(row.key));
const missingFixtureFiles = mappingAssertions.filter((row) => !existsSync(resolve(ROOT, row.fixturePath)));

let failures = 0;

if (missingMappings.length > 0) {
  failures += 1;
  console.error("Missing mapping rows for evidence assertions:");
  for (const row of missingMappings) {
    console.error(`  ${row.key}`);
  }
}

if (unmappedExtras.length > 0) {
  failures += 1;
  console.error("Mapping rows not found in evidence assertions:");
  for (const row of unmappedExtras) {
    console.error(`  ${row.key} (${row.mappingId})`);
  }
}

if (missingFixtureFiles.length > 0) {
  failures += 1;
  console.error("Mapping rows reference missing fixture files:");
  for (const row of missingFixtureFiles) {
    console.error(`  ${row.mappingId} -> ${row.fixturePath}`);
  }
}

if (failures > 0) {
  process.exit(1);
}

console.log(
  `Assertion matrix integrity check passed (${evidenceAssertions.length} assertions, ${mappingAssertions.length} mappings).`
);
