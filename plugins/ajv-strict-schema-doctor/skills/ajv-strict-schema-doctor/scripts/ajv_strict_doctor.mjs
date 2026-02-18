import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_SCHEMA_GLOBS = ["schemas/**/*.json"];
const DEFAULT_IGNORE_GLOBS = ["**/.git/**", "**/node_modules/**", "**/dist/**", "**/build/**"];

function printHelp() {
  console.log("AJV Strict Schema Doctor");
  console.log("");
  console.log("Usage:");
  console.log('  node scripts/ajv_strict_doctor.mjs [--schemas "<glob>[,<glob>...]"] [--ignore "<glob>[,<glob>...]"]');
  console.log("                                   [--strict <true|log|false>] [--json] [--report <path>] [--cwd <path>]");
  console.log("");
  console.log("Examples:");
  console.log('  node scripts/ajv_strict_doctor.mjs --schemas "schemas/**/*.json"');
  console.log('  node scripts/ajv_strict_doctor.mjs --schemas "schemas/**/*.json,fixtures/**/*.schema.json" --ignore "**/vendor/**"');
  console.log('  node scripts/ajv_strict_doctor.mjs --schemas "schemas/**/*.json" --json --report ".reports/ajv-doctor.json"');
}

function normalizePath(value) {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\/+/, "");
}

function splitList(value) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseStrictValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "log") return "log";
  throw new Error(`Invalid --strict value: ${value}. Expected true, log, or false.`);
}

function parseArgs(argv) {
  const args = {
    schemas: [...DEFAULT_SCHEMA_GLOBS],
    ignore: [...DEFAULT_IGNORE_GLOBS],
    strict: true,
    json: false,
    report: null,
    cwd: process.cwd()
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];

    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }

    if (token === "--json") {
      args.json = true;
      continue;
    }

    if (token === "--schemas" || token.startsWith("--schemas=")) {
      const raw = token === "--schemas" ? argv[++i] : token.slice("--schemas=".length);
      if (!raw) throw new Error("Missing value for --schemas");
      args.schemas = splitList(raw);
      continue;
    }

    if (token === "--ignore" || token.startsWith("--ignore=")) {
      const raw = token === "--ignore" ? argv[++i] : token.slice("--ignore=".length);
      if (!raw) throw new Error("Missing value for --ignore");
      args.ignore = splitList(raw);
      continue;
    }

    if (token === "--strict" || token.startsWith("--strict=")) {
      const raw = token === "--strict" ? argv[++i] : token.slice("--strict=".length);
      if (!raw) throw new Error("Missing value for --strict");
      args.strict = parseStrictValue(raw);
      continue;
    }

    if (token === "--report" || token.startsWith("--report=")) {
      const raw = token === "--report" ? argv[++i] : token.slice("--report=".length);
      if (!raw) throw new Error("Missing value for --report");
      args.report = raw;
      continue;
    }

    if (token === "--cwd" || token.startsWith("--cwd=")) {
      const raw = token === "--cwd" ? argv[++i] : token.slice("--cwd=".length);
      if (!raw) throw new Error("Missing value for --cwd");
      args.cwd = path.resolve(raw);
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return args;
}

function splitSegments(value) {
  const normalized = normalizePath(value);
  if (!normalized || normalized === ".") return [];
  return normalized.split("/").filter((segment) => segment.length > 0 && segment !== ".");
}

function segmentToRegex(segment) {
  const escaped = segment
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*")
    .replace(/\?/g, ".");
  return new RegExp(`^${escaped}$`);
}

function segmentMatches(patternSegment, candidateSegment) {
  if (patternSegment === "**") return true;
  return segmentToRegex(patternSegment).test(candidateSegment);
}

function matchesSegments(patternSegments, candidateSegments, pIndex = 0, cIndex = 0) {
  while (pIndex < patternSegments.length) {
    const token = patternSegments[pIndex];
    if (token === "**") {
      if (pIndex === patternSegments.length - 1) return true;
      for (let i = cIndex; i <= candidateSegments.length; i += 1) {
        if (matchesSegments(patternSegments, candidateSegments, pIndex + 1, i)) return true;
      }
      return false;
    }
    if (cIndex >= candidateSegments.length) return false;
    if (!segmentMatches(token, candidateSegments[cIndex])) return false;
    pIndex += 1;
    cIndex += 1;
  }
  return cIndex === candidateSegments.length;
}

function compileGlob(pattern) {
  return {
    raw: normalizePath(pattern),
    segments: splitSegments(pattern)
  };
}

function matchesAnyGlob(compiledGlobs, candidatePath) {
  if (!compiledGlobs.length) return false;
  const segments = splitSegments(candidatePath);
  return compiledGlobs.some((glob) => matchesSegments(glob.segments, segments));
}

function rootFromPattern(pattern) {
  const segments = splitSegments(pattern);
  const root = [];
  for (const segment of segments) {
    if (segment === "**" || segment.includes("*") || segment.includes("?")) break;
    root.push(segment);
  }
  return root.length ? root.join("/") : ".";
}

function toRelative(cwd, filePath) {
  const rel = normalizePath(path.relative(cwd, filePath));
  return rel === "." ? "" : rel;
}

function shouldIgnoreDir(ignoreGlobs, relDir) {
  if (!relDir) return false;
  if (matchesAnyGlob(ignoreGlobs, relDir)) return true;
  return matchesAnyGlob(ignoreGlobs, `${relDir}/__dir_probe__`);
}

function walkJsonFiles(rootAbs, rootRel, ignoreGlobs, results) {
  const stack = [{ abs: rootAbs, rel: rootRel }];

  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current.abs, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(current.abs, entry.name);
      const rel = normalizePath(current.rel ? path.join(current.rel, entry.name) : entry.name);

      if (entry.isDirectory()) {
        if (shouldIgnoreDir(ignoreGlobs, rel)) continue;
        stack.push({ abs, rel });
        continue;
      }

      if (!entry.isFile()) continue;
      if (!entry.name.toLowerCase().endsWith(".json")) continue;
      if (matchesAnyGlob(ignoreGlobs, rel)) continue;
      results.add(abs);
    }
  }
}

function listSchemaFiles(patterns, ignorePatterns, cwd) {
  const effectivePatterns = [];
  const ignoreGlobs = ignorePatterns.map(compileGlob);
  const candidates = new Set();
  const roots = new Set();

  for (const pattern of patterns) {
    const normalized = normalizePath(pattern);
    const absolute = path.resolve(cwd, normalized);
    const hasWildcards = /[*?]/.test(normalized);

    if (!hasWildcards && fs.existsSync(absolute)) {
      const st = fs.statSync(absolute);
      if (st.isFile()) {
        const rel = toRelative(cwd, absolute);
        if (rel && !matchesAnyGlob(ignoreGlobs, rel)) candidates.add(absolute);
        effectivePatterns.push(normalized);
        continue;
      }
      if (st.isDirectory()) {
        const dirGlob = normalizePath(path.join(normalized, "**/*.json"));
        effectivePatterns.push(dirGlob);
        roots.add(normalized);
        continue;
      }
    }

    effectivePatterns.push(normalized);
    roots.add(rootFromPattern(normalized));
  }

  const includeGlobs = effectivePatterns.map(compileGlob);

  for (const root of roots) {
    const absoluteRoot = path.resolve(cwd, root);
    if (!fs.existsSync(absoluteRoot)) continue;

    const st = fs.statSync(absoluteRoot);
    if (st.isFile()) {
      const rel = toRelative(cwd, absoluteRoot);
      if (rel && !matchesAnyGlob(ignoreGlobs, rel)) candidates.add(absoluteRoot);
      continue;
    }

    if (st.isDirectory()) {
      const relRoot = toRelative(cwd, absoluteRoot);
      if (shouldIgnoreDir(ignoreGlobs, relRoot)) continue;
      walkJsonFiles(absoluteRoot, relRoot, ignoreGlobs, candidates);
    }
  }

  const matched = [];
  for (const absolute of candidates) {
    const rel = toRelative(cwd, absolute);
    if (!rel) continue;
    if (!matchesAnyGlob(includeGlobs, rel)) continue;
    if (matchesAnyGlob(ignoreGlobs, rel)) continue;
    matched.push(absolute);
  }

  return matched.sort((a, b) => a.localeCompare(b));
}

function trimMessage(message, maxLength = 500) {
  if (message.length <= maxLength) return message;
  return `${message.slice(0, maxLength - 3)}...`;
}

function classifyAjvStrictError(message) {
  if (message.includes('no schema with key or ref "https://json-schema.org/draft/2020-12/schema"')) {
    return {
      kind: "missing-2020-metaschema",
      likelyCause: "Ajv instance is not using the draft 2020-12 build.",
      schemaLocalFix: 'Use `import Ajv from "ajv/dist/2020.js"` in compile scripts.'
    };
  }

  if (message.includes("allowMatchingProperties") && message.includes("matches pattern")) {
    return {
      kind: "allowMatchingProperties",
      likelyCause: "A literal property key is also matched by patternProperties.",
      schemaLocalFix: "Narrow or exclude the literal key from patternProperties (prefer a negative lookahead pattern).",
      ajvOption: "allowMatchingProperties: true"
    };
  }

  if (message.includes("strictRequired") && message.includes('required property "')) {
    return {
      kind: "strictRequired",
      likelyCause: "A required key is declared in a subschema where that key is not defined in properties.",
      schemaLocalFix: "Define the required key in the same subschema that declares required."
    };
  }

  if (message.includes("strictTypes")) {
    return {
      kind: "strictTypes",
      likelyCause: "Type-specific keywords are used without an explicit type.",
      schemaLocalFix: 'Add explicit `type` (usually `object` or `array`) where `properties`, `required`, `items`, etc. are used.'
    };
  }

  if (message.includes("unknown keyword")) {
    return {
      kind: "unknown-keyword",
      likelyCause: "Schema contains a keyword that Ajv does not recognize in the current dialect/config.",
      schemaLocalFix: "Correct keyword spelling, ensure the right JSON Schema draft, or register a custom keyword intentionally."
    };
  }

  if (message.includes("unknown format")) {
    return {
      kind: "unknown-format",
      likelyCause: "A format is used that Ajv does not know about.",
      schemaLocalFix: "Use a standard format, register a custom format, or remove the format if not required."
    };
  }

  if (
    message.includes("can't resolve reference") ||
    message.includes("can't resolve ref") ||
    message.includes("reference resolves to more than one schema")
  ) {
    return {
      kind: "unresolved-ref",
      likelyCause: "$ref target cannot be resolved from current $id/file layout.",
      schemaLocalFix: "Ensure referenced schema is loaded, has a stable $id, and uses consistent relative/absolute ref paths."
    };
  }

  if (message.includes("schema with key or id") && message.includes("already exists")) {
    return {
      kind: "duplicate-schema-id",
      likelyCause: "Two schemas share the same key/$id.",
      schemaLocalFix: "Make each schema $id unique or avoid adding the same schema under multiple conflicting keys."
    };
  }

  if (message.includes("schema is invalid")) {
    return {
      kind: "invalid-schema",
      likelyCause: "Schema structure violates JSON Schema meta-schema rules.",
      schemaLocalFix: "Fix the invalid keyword/value shape reported by Ajv and recompile."
    };
  }

  return {
    kind: "unknown",
    likelyCause: "Unhandled Ajv compilation error.",
    schemaLocalFix: "Inspect the message, patch schema locally first, and retry with --strict log if triage needs more signal."
  };
}

function classifyJsonParseError(error) {
  return {
    kind: "invalid-json",
    likelyCause: "Schema file is not valid JSON.",
    schemaLocalFix: "Fix JSON syntax before running Ajv compilation.",
    message: String(error?.message || error)
  };
}

async function createAjv(strictMode) {
  const { default: Ajv } = await import("ajv/dist/2020.js");
  const { default: addFormats } = await import("ajv-formats");
  const ajv = new Ajv({ strict: strictMode, allErrors: true, validateSchema: true });
  addFormats(ajv);
  return ajv;
}

function renderFailure(result) {
  console.log(`❌ Failed: ${result.file}`);
  console.log(`   Class: ${result.kind}`);
  console.log(`   Cause: ${result.likely_cause}`);
  console.log(`   Fix:   ${result.schema_local_fix}`);
  if (result.optional_ajv_option) {
    console.log(`   Ajv option (last resort): ${result.optional_ajv_option}`);
  }
  console.log(`   Error: ${result.error}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  const cwd = args.cwd;
  const files = listSchemaFiles(args.schemas, args.ignore, cwd);
  if (!files.length) {
    console.error(`No schema files matched include globs: ${args.schemas.join(", ")}`);
    process.exit(2);
  }

  const docs = [];
  const results = [];
  for (const absolute of files) {
    const rel = toRelative(cwd, absolute);
    const raw = fs.readFileSync(absolute, "utf8");
    try {
      const schema = JSON.parse(raw);
      const explicitId = typeof schema?.$id === "string" ? schema.$id.trim() : "";
      const key = explicitId || pathToFileURL(absolute).href;
      docs.push({ absolute, rel, schema, key });
    } catch (error) {
      const parsed = classifyJsonParseError(error);
      results.push({
        file: rel,
        ok: false,
        kind: parsed.kind,
        likely_cause: parsed.likelyCause,
        schema_local_fix: parsed.schemaLocalFix,
        optional_ajv_option: null,
        error: trimMessage(parsed.message)
      });
    }
  }

  const ajv = await createAjv(args.strict);
  const preloadErrors = new Map();

  for (const doc of docs) {
    try {
      ajv.addSchema(doc.schema, doc.key);
    } catch (error) {
      preloadErrors.set(doc.key, error);
    }
  }

  for (const doc of docs) {
    const preloadError = preloadErrors.get(doc.key);
    if (preloadError) {
      const message = String(preloadError?.message || preloadError);
      const classified = classifyAjvStrictError(message);
      results.push({
        file: doc.rel,
        ok: false,
        kind: classified.kind,
        likely_cause: classified.likelyCause,
        schema_local_fix: classified.schemaLocalFix,
        optional_ajv_option: classified.ajvOption || null,
        error: trimMessage(message)
      });
      continue;
    }

    try {
      const validator = ajv.getSchema(doc.key);
      if (!validator) ajv.compile(doc.schema);
      results.push({ file: doc.rel, ok: true });
    } catch (error) {
      const message = String(error?.message || error);
      const classified = classifyAjvStrictError(message);
      results.push({
        file: doc.rel,
        ok: false,
        kind: classified.kind,
        likely_cause: classified.likelyCause,
        schema_local_fix: classified.schemaLocalFix,
        optional_ajv_option: classified.ajvOption || null,
        error: trimMessage(message)
      });
    }
  }

  const failed = results.filter((item) => !item.ok);
  const passed = results.filter((item) => item.ok);

  const report = {
    generated_at: new Date().toISOString(),
    cwd,
    strict: args.strict,
    include_globs: args.schemas,
    ignore_globs: args.ignore,
    summary: {
      files_matched: files.length,
      compiled_ok: passed.length,
      failed: failed.length
    },
    results
  };

  if (args.report) {
    const reportPath = path.resolve(cwd, args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log("AJV strict schema doctor");
    console.log(`cwd: ${cwd}`);
    console.log(`strict: ${String(args.strict)}`);
    console.log(`matched files: ${files.length}`);
    console.log("");

    for (const result of results) {
      if (result.ok) {
        console.log(`✅ Compiled: ${result.file}`);
      } else {
        renderFailure(result);
      }
    }

    console.log("");
    console.log(`Summary: ${passed.length} passed, ${failed.length} failed.`);
    if (args.report) {
      console.log(`Report: ${path.resolve(cwd, args.report)}`);
    }
  }

  process.exit(failed.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
