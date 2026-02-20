import { execSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

const README_PATH = resolve(ROOT, "README.md");
const EVIDENCE_PATH = resolve(ROOT, "docs/FIXTURE-EVIDENCE.json");
const PACKAGE_PATH = resolve(ROOT, "package.json");

const START_MARKER = "<!-- sync-deviations-metadata:start -->";
const END_MARKER = "<!-- sync-deviations-metadata:end -->";

function readRepoSha() {
  return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf8" }).trim();
}

function buildMetadataLine(evidence, pkg, sha) {
  const checkedAt = evidence?.sourceRefs?.cliRun?.checkedAt ?? evidence?.checkedAt ?? "unknown-date";
  const cliVersion = evidence?.sourceRefs?.cliRun?.cliVersion ?? "unknown-cli";
  const schemaVersion = pkg?.version ?? "unknown-schema";
  return `_As of ${checkedAt} | CLI ${cliVersion} | Schema v${schemaVersion} | Repo ${sha}_`;
}

function replaceMetadataBlock(readmeRaw, metadataLine) {
  const start = readmeRaw.indexOf(START_MARKER);
  const end = readmeRaw.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("README metadata markers are missing or malformed.");
  }

  const before = readmeRaw.slice(0, start + START_MARKER.length);
  const after = readmeRaw.slice(end);
  return `${before}\n${metadataLine}\n${after}`;
}

function extractMetadataLine(readmeRaw) {
  const start = readmeRaw.indexOf(START_MARKER);
  const end = readmeRaw.indexOf(END_MARKER);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("README metadata markers are missing or malformed.");
  }
  return readmeRaw.slice(start + START_MARKER.length, end).trim();
}

async function main() {
  const checkOnly = process.argv.includes("--check");
  const [readmeRaw, evidenceRaw, packageRaw] = await Promise.all([
    readFile(README_PATH, "utf8"),
    readFile(EVIDENCE_PATH, "utf8"),
    readFile(PACKAGE_PATH, "utf8"),
  ]);

  const evidence = JSON.parse(evidenceRaw);
  const pkg = JSON.parse(packageRaw);
  const checkedAt = evidence?.sourceRefs?.cliRun?.checkedAt ?? evidence?.checkedAt ?? "unknown-date";
  const cliVersion = evidence?.sourceRefs?.cliRun?.cliVersion ?? "unknown-cli";
  const schemaVersion = pkg?.version ?? "unknown-schema";

  const metadataLine = buildMetadataLine(evidence, pkg, readRepoSha());
  const nextReadme = replaceMetadataBlock(readmeRaw, metadataLine);

  if (checkOnly) {
    const existingLine = extractMetadataLine(readmeRaw);
    const expectedPrefix = `_As of ${checkedAt} | CLI ${cliVersion} | Schema v${schemaVersion} | Repo `;
    const validShape = /^_As of .+ \| CLI .+ \| Schema v.+ \| Repo [0-9a-f]+_$/.test(existingLine);
    const matchesExpectedSources = existingLine.startsWith(expectedPrefix);

    if (!validShape || !matchesExpectedSources) {
      console.error("Known Deviations metadata is out of sync. Run: npm run sync:deviations-metadata");
      process.exit(1);
    }
    console.log("Known Deviations metadata is up to date.");
    return;
  }

  if (nextReadme !== readmeRaw) {
    await writeFile(README_PATH, nextReadme);
    console.log("Updated Known Deviations metadata in README.");
  } else {
    console.log("Known Deviations metadata already up to date.");
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
