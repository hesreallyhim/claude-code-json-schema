#!/usr/bin/env node

import fs from "node:fs";
import { basename, dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const CWD = process.cwd();

const EXCLUDED_DIR_NAMES = new Set([
  ".cache",
  ".git",
  ".mypy_cache",
  ".next",
  ".turbo",
  ".venv",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
  "venv",
]);

function usage() {
  console.log(`Usage: node tools/lint-manifests.mjs [--plugin] [--marketplace] [path]

Validates plugin.json and/or marketplace.json manifests using local schemas.

Options:
  --plugin        Validate only plugin.json
  --marketplace   Validate only marketplace.json
  --help          Show this help

Arguments:
  path            File or directory to scan recursively (default: current directory)

Policy:
  - Symlinks are not followed.
  - Nested git repos/submodules are skipped.
`);
}

function parseArgs(argv) {
  let pluginOnly = false;
  let marketplaceOnly = false;
  let targetPath = ".";

  const positional = [];
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      usage();
      process.exit(0);
    }
    if (arg === "--plugin") {
      pluginOnly = true;
      continue;
    }
    if (arg === "--marketplace") {
      marketplaceOnly = true;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown flag: ${arg}`);
    }
    positional.push(arg);
  }

  if (positional.length > 1) {
    throw new Error("Expected at most one positional path argument.");
  }
  if (positional.length === 1) {
    targetPath = positional[0];
  }

  let includePlugin = true;
  let includeMarketplace = true;
  if (pluginOnly && !marketplaceOnly) {
    includePlugin = true;
    includeMarketplace = false;
  } else if (marketplaceOnly && !pluginOnly) {
    includePlugin = false;
    includeMarketplace = true;
  }

  return {
    includePlugin,
    includeMarketplace,
    targetPath: resolve(CWD, targetPath),
  };
}

function isNestedGitRepo(dirPath) {
  return fs.existsSync(resolve(dirPath, ".git"));
}

function collectManifestFiles(startPath, targetNames) {
  const files = [];

  function walkDirectory(dirPath, isRoot) {
    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`warning: unable to read ${relative(CWD, dirPath) || "."}: ${message}`);
      return;
    }

    for (const entry of entries) {
      const fullPath = resolve(dirPath, entry.name);

      if (entry.isSymbolicLink()) {
        continue;
      }

      if (entry.isDirectory()) {
        if (EXCLUDED_DIR_NAMES.has(entry.name)) {
          continue;
        }
        if (!isRoot && isNestedGitRepo(fullPath)) {
          continue;
        }
        walkDirectory(fullPath, false);
        continue;
      }

      if (entry.isFile() && targetNames.has(entry.name)) {
        files.push(fullPath);
      }
    }
  }

  const stat = fs.lstatSync(startPath);

  if (stat.isSymbolicLink()) {
    throw new Error(`Refusing to follow symlink target: ${startPath}`);
  }

  if (stat.isFile()) {
    const name = basename(startPath);
    if (targetNames.has(name)) {
      files.push(startPath);
    }
    return files;
  }

  if (stat.isDirectory()) {
    walkDirectory(startPath, true);
    return files;
  }

  throw new Error(`Path is neither a regular file nor directory: ${startPath}`);
}

function buildValidators(includePlugin, includeMarketplace) {
  const ajv = new Ajv({ allErrors: true, strict: true });
  addFormats(ajv);

  const validators = {};

  if (includePlugin) {
    const pluginSchema = JSON.parse(
      fs.readFileSync(resolve(ROOT, "schemas/plugin.schema.json"), "utf8"),
    );
    validators.plugin = ajv.compile(pluginSchema);
  }

  if (includeMarketplace) {
    const marketplaceSchema = JSON.parse(
      fs.readFileSync(resolve(ROOT, "schemas/marketplace.schema.json"), "utf8"),
    );
    validators.marketplace = ajv.compile(marketplaceSchema);
  }

  return validators;
}

function formatAjvErrors(errors) {
  if (!errors || errors.length === 0) {
    return "(no details)";
  }
  return errors
    .slice(0, 3)
    .map((err) => `${err.keyword} at ${err.instancePath || "/"}: ${err.message}`)
    .join(" | ");
}

function run() {
  let config;
  try {
    config = parseArgs(process.argv.slice(2));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`error: ${message}`);
    usage();
    process.exit(2);
  }

  if (!fs.existsSync(config.targetPath)) {
    console.error(`error: path does not exist: ${config.targetPath}`);
    process.exit(2);
  }

  const targetNames = new Set();
  if (config.includePlugin) {
    targetNames.add("plugin.json");
  }
  if (config.includeMarketplace) {
    targetNames.add("marketplace.json");
  }

  let files;
  try {
    files = collectManifestFiles(config.targetPath, targetNames).sort();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`error: ${message}`);
    process.exit(2);
  }

  if (files.length === 0) {
    console.log("No matching manifest files found.");
    process.exit(0);
  }

  const validators = buildValidators(config.includePlugin, config.includeMarketplace);

  let failed = 0;
  for (const file of files) {
    const name = basename(file);
    const kind = name === "plugin.json" ? "plugin" : "marketplace";
    const validate = validators[kind];
    if (!validate) {
      continue;
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${relative(CWD, file)} :: invalid JSON (${message})`);
      continue;
    }

    const ok = validate(data);
    if (!ok) {
      failed += 1;
      console.error(`✗ ${relative(CWD, file)} :: ${formatAjvErrors(validate.errors)}`);
      continue;
    }

    console.log(`✓ ${relative(CWD, file)}`);
  }

  const passed = files.length - failed;
  console.log(`Summary: ${passed} passed, ${failed} failed, ${files.length} total.`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
